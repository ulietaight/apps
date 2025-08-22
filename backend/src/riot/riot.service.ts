import { Injectable } from '@nestjs/common';

const RIOT_API_KEY = 'RGAPI-a887b009-9bb6-4b3a-af56-8e5e0e894360'// process.env.RIOT_API_KEY;
const REGION = 'europe';

@Injectable()
export class RiotService {
  private async fetchJson(url: string) {
    const res = await fetch(url, {
      headers: { 'X-Riot-Token': RIOT_API_KEY ?? '' },
    });
    if (!res.ok) {
      throw new Error(`Riot API error: ${res.status}`);
    }
    return res.json();
  }

  async getAccount(gameName: string, tagLine: string) {
    const url = `https://${REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    return this.fetchJson(url);
  }

  async getLastMatches(gameName: string, tagLine: string) {
    const account = await this.getAccount(gameName, tagLine);
    const { puuid } = account;
    const idsUrl = `https://${REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=25`;
    const matchIds: string[] = await this.fetchJson(idsUrl);
    const matchPromises = matchIds.map((id) =>
      this.fetchJson(`https://${REGION}.api.riotgames.com/lol/match/v5/matches/${id}`),
    );
    return Promise.all(matchPromises);
  }
}
