import { Controller, Get, Param } from '@nestjs/common';
import { RiotService } from './riot.service';

@Controller('riot')
export class RiotController {
  constructor(private readonly riotService: RiotService) {}

  @Get('account/:gameName/:tagLine')
  getAccount(@Param('gameName') gameName: string, @Param('tagLine') tagLine: string) {
    return this.riotService.getAccount(gameName, tagLine);
  }

  @Get('matches/:gameName/:tagLine')
  getMatches(@Param('gameName') gameName: string, @Param('tagLine') tagLine: string) {
    return this.riotService.getLastMatches(gameName, tagLine);
  }
}
