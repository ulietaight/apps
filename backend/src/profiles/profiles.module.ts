import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { ProfilesLookupConsumer } from './profiles.lookup.consumer';
import { KafkaModule } from '../kafka/kafka.module';
import { RiotModule } from '../riot/riot.module';

@Module({
  imports: [KafkaModule, RiotModule],
  controllers: [ProfilesController],
  providers: [ProfilesService, ProfilesLookupConsumer],
})
export class ProfilesModule {}
