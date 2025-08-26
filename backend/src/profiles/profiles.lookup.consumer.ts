import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { RiotService } from '../riot/riot.service';

const MAX_ATTEMPTS = 3;

@Injectable()
export class ProfilesLookupConsumer implements OnModuleInit {
  private readonly logger = new Logger(ProfilesLookupConsumer.name);

  constructor(
    private readonly kafka: KafkaService,
    private readonly riot: RiotService,
  ) {}

  async onModuleInit() {
    await this.kafka.consume(
      'profiles.lookup.requested',
      this.handle.bind(this),
    );
  }

  private async handle(payload: any) {
    const { eventId, riotName, tag, attempt = 0 } = payload;
    try {
      const account = await this.riot.getAccount(riotName, tag);
      const matches = await this.riot.getLastMatches(riotName, tag);
      const lastMatchId = matches[0]?.id;
      await this.kafka.emit('ui.notify', {
        eventId,
        status: 'completed',
        puuid: account.puuid,
        lastMatchId,
      });
    } catch (error: any) {
      this.logger.error(`Lookup failed for ${riotName}#${tag}: ${error?.message}`);
      if (attempt + 1 < MAX_ATTEMPTS) {
        await this.kafka.emit('profiles.lookup.requested', {
          eventId,
          riotName,
          tag,
          attempt: attempt + 1,
        });
      } else {
        await this.kafka.emit('profiles.lookup.failed', {
          eventId,
          riotName,
          tag,
          reason: error?.message || 'unknown',
        });
      }
    }
  }
}
