import { Module } from '@nestjs/common';
import { RiotService } from './riot.service';
import { RiotController } from './riot.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RiotService],
  controllers: [RiotController],
})
export class RiotModule {}
