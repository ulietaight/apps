import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { Redis as RedisClient } from 'ioredis';
import { Counter } from 'prom-client';

const RIOT_API_KEY = process.env.RIOT_API_KEY || '';
const REGION = process.env.RIOT_REGIONAL || 'europe';
const BATCH_SIZE = 2;
const BATCH_DELAY_MS = 1200;
const ONE_HOUR_MS = 60 * 60 * 1000;

const riotApiRequests = new Counter({
  name: 'riot_api_requests_total',
  help: 'Total Riot API requests',
});

@Injectable()
export class RiotService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
  ) {}

  private async sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  private simplifyMatch(puuid: string, match: any) {
    const participant = match.info.participants.find(
      (p: any) => p.puuid === puuid,
    );
    return {
      id: match.metadata.matchId,
      champion: participant.championName,
      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      win: participant.win,
      gameDuration: match.info.gameDuration,
      gameMode: match.info.gameMode,
      gameStart: match.info.gameStartTimestamp,
    };
  }

  private async fetchJson(url: string, attempt = 0): Promise<any> {
    riotApiRequests.inc();
    const res = await fetch(url, { headers: { 'X-Riot-Token': RIOT_API_KEY } });

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
    if (cached) {
      return JSON.parse(cached);
    }

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

    const cacheKey = `matches:${puuid}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < ONE_HOUR_MS) {
        return parsed.matches;
      }
    }

    const dbHistory = await this.prisma.matchHistory.findUnique({ where: { puuid } });
    if (dbHistory) {
      if (Date.now() - dbHistory.updatedAt.getTime() < ONE_HOUR_MS) {
        await this.redis.set(
          cacheKey,
          JSON.stringify({ matches: dbHistory.matches, fetchedAt: Date.now() }),
          'EX',
          3600,
        );
        return dbHistory.matches as any[];
      }

      const latestIds = await this.fetchJson(
        `https://${REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=1`,
      );
      const latestId = latestIds[0];
      const hasLatest = (dbHistory.matches as any[]).some((m: any) => m.id === latestId);
      if (hasLatest) {
        await this.prisma.matchHistory.update({
          where: { puuid },
          data: { updatedAt: new Date() },
        });
        await this.redis.set(
          cacheKey,
          JSON.stringify({ matches: dbHistory.matches, fetchedAt: Date.now() }),
          'EX',
          3600,
        );
        return dbHistory.matches as any[];
      }
    }

    const idsUrl = `https://${REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10`;
    const matchIds: string[] = await this.fetchJson(idsUrl);

    const fullMatches: any[] = [];
    for (let i = 0; i < matchIds.length; i += BATCH_SIZE) {
      const batch = matchIds.slice(i, i + BATCH_SIZE);
      const batchMatches = await Promise.all(batch.map((id) => this.getMatch(puuid, id)));
      fullMatches.push(...batchMatches);
      await this.sleep(BATCH_DELAY_MS);
    }

    const simplified = fullMatches.map((m) => this.simplifyMatch(puuid, m));

    await this.prisma.matchHistory.upsert({
      where: { puuid },
      update: { matches: simplified },
      create: { puuid, matches: simplified },
    });

    await this.redis.set(
      cacheKey,
      JSON.stringify({ matches: simplified, fetchedAt: Date.now() }),
      'EX',
      3600,
    );

    return simplified;
  }
}
