import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { Redis as RedisClient } from 'ioredis';

const RIOT_API_KEY = process.env.RIOT_API_KEY || '';
const REGION = process.env.RIOT_REGIONAL || 'europe';
const BATCH_SIZE = 2;
const BATCH_DELAY_MS = 1200;

@Injectable()
export class RiotService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
  ) {}

  private async sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  private async fetchJson(url: string, attempt = 0): Promise<any> {
    const res = await fetch(url, { headers: { 'X-Riot-Token': RIOT_API_KEY } });
    console.log('res', res)
    console.log('RIOT_API_KEY', RIOT_API_KEY)

    if (res.status === 429 && attempt < 5) {
      const ra = Number(res.headers.get('retry-after') || 1) * 1000;
      await this.sleep(ra || 1000);
      return this.fetchJson(url, attempt + 1);
    }

    if (!res.ok) throw new Error(`Riot API error: ${res.status}`);

    return res.json();
  }

  async getAccount(gameName: string, tagLine: string) {
    const cacheKey = `account:${gameName}:${tagLine}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const dbAccount = await this.prisma.riotAccount.findFirst({
      where: { gameName, tagLine },
    });
    if (dbAccount) {
      await this.redis.set(cacheKey, JSON.stringify(dbAccount.data), 'EX', 3600);
      return dbAccount.data;
    }

    const url = `https://${REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const account = await this.fetchJson(url);

    await this.prisma.riotAccount.upsert({
      where: { puuid: account.puuid }, // puuid уникальный ключ
      update: { gameName: account.gameName, tagLine: account.tagLine, data: account },
      create: { puuid: account.puuid, gameName: account.gameName, tagLine: account.tagLine, data: account },
    });

    await this.redis.set(cacheKey, JSON.stringify(account), 'EX', 3600);
    return account;
  }

  private async getMatch(puuid: string, id: string) {
    const cacheKey = `match:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const dbMatch = await this.prisma.match.findUnique({ where: { id } });
    if (dbMatch) {
      await this.redis.set(cacheKey, JSON.stringify(dbMatch.data), 'EX', 7 * 24 * 3600);
      return dbMatch.data;
    }

    const data = await this.fetchJson(`https://${REGION}.api.riotgames.com/lol/match/v5/matches/${id}`);

    await this.prisma.match.upsert({
      where: { id },
      update: { puuid, data },
      create: { id, puuid, data },
    });

    await this.redis.set(cacheKey, JSON.stringify(data), 'EX', 7 * 24 * 3600);
    return data;
  }

  async getLastMatches(gameName: string, tagLine: string) {
    const account = await this.getAccount(gameName, tagLine);
    const { puuid } = account;

    const idsCacheKey = `matches_ids:${puuid}`;
    const cachedIds = await this.redis.get(idsCacheKey);
    let matchIds: string[];

    if (cachedIds) {
      matchIds = JSON.parse(cachedIds);
    } else {
      const idsUrl = `https://${REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10`;
      matchIds = await this.fetchJson(idsUrl);
      await this.redis.set(idsCacheKey, JSON.stringify(matchIds), 'EX', 30);
    }

    const matches: any[] = [];
    for (let i = 0; i < matchIds.length; i += BATCH_SIZE) {
      const batch = matchIds.slice(i, i + BATCH_SIZE);
      const batchMatches = await Promise.all(batch.map((id) => this.getMatch(puuid, id)));
      matches.push(...batchMatches);
      await this.sleep(BATCH_DELAY_MS);
    }

    await this.redis.set(`matches:${puuid}`, JSON.stringify(matches), 'EX', 30);
    return matches;
  }
}
