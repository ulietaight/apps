import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { KafkaService } from '../kafka/kafka.service';
import { LookupDto } from './dto/lookup.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly kafka: KafkaService) {}

  async requestLookup(dto: LookupDto) {
    const eventId = randomUUID();
    await this.kafka.emit('profiles.lookup.requested', {
      eventId,
      riotName: dto.riotName,
      tag: dto.tag,
      attempt: 0,
    });
    return { eventId };
  }
}
