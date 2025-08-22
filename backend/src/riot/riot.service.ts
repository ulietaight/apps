import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';

const RIOT_API_KEY = 'RGAPI-a887b009-9bb6-4b3a-af56-8e5e0e894360'; // process.env.RIOT_API_KEY;
const REGION = 'europe';
const BATCH_SIZE = 3;
const BATCH_DELAY_MS = 1200;

@Injectable()
export class RiotService {
  private readonly redis = new Redis(
    process.env.REDIS_URL ?? 'redis://localhost:6379',
  );

  constructor(private readonly prisma: PrismaService) {}

  private async fetchJson(url: string) {
    const res = await fetch(url, {
      headers: { 'X-Riot-Token': RIOT_API_KEY ?? '' },
    });
    if (res.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    if (!res.ok) {
      throw new Error(`Riot API error: ${res.status}`);
    }
    return res.json();
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getAccount(gameName: string, tagLine: string) {
    const cacheKey = `account:${gameName}:${tagLine}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const dbAccount = await this.prisma.riotAccount.findFirst({
      where: { gameName, tagLine },
    });
    if (dbAccount) {
      await this.redis.set(cacheKey, JSON.stringify(dbAccount.data));
      return dbAccount.data;
    }

    const url = `https://${REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const account = await this.fetchJson(url);
    await this.prisma.riotAccount.upsert({
      where: { puuid: account.puuid },
      update: {
        gameName: account.gameName,
        tagLine: account.tagLine,
        data: account,
      },
      create: {
        puuid: account.puuid,
        gameName: account.gameName,
        tagLine: account.tagLine,
        data: account,
      },
    });
    await this.redis.set(cacheKey, JSON.stringify(account));
    return account;
  }

  private async getMatch(puuid: string, id: string) {
    const cacheKey = `match:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const dbMatch = await this.prisma.match.findUnique({ where: { id } });
    if (dbMatch) {
      await this.redis.set(cacheKey, JSON.stringify(dbMatch.data));
      return dbMatch.data;
    }

    const data = await this.fetchJson(
      `https://${REGION}.api.riotgames.com/lol/match/v5/matches/${id}`,
    );
    await this.prisma.match.upsert({
      where: { id },
      update: { puuid, data },
      create: { id, puuid, data },
    });
    await this.redis.set(cacheKey, JSON.stringify(data));
    return data;
  }

  async getLastMatches(gameName: string, tagLine: string) {
    const account = await this.getAccount(gameName, tagLine);
    const { puuid } = account;

    const cacheKey = `matches:${puuid}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const idsUrl = `https://${REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=25`;
    const matchIds: string[] = await this.fetchJson(idsUrl);
    const matches = [] as any[];

    for (let i = 0; i < matchIds.length; i += BATCH_SIZE) {
      const batch = matchIds.slice(i, i + BATCH_SIZE);
      try {
        const batchMatches = await Promise.all(
          batch.map((id) => this.getMatch(puuid, id)),
        );
        matches.push(...batchMatches);
      } catch (e: any) {
        if (e.message === 'RATE_LIMIT') {
          break;
        }
        throw e;
      }
      await this.sleep(BATCH_DELAY_MS);
    }

    await this.redis.set(cacheKey, JSON.stringify(matches));
    return matches;
  }
}
