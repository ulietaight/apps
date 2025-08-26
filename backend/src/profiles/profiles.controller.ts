import { Body, Controller, Post } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { LookupDto } from './dto/lookup.dto';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post('lookup')
  async lookup(@Body() dto: LookupDto) {
    return this.profilesService.requestLookup(dto);
  }
}
