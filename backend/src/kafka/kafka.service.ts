import { Injectable, Logger } from '@nestjs/common';
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';

@Injectable()
export class KafkaService {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;

  constructor() {
    const brokers = process.env.KAFKA_BROKERS;
    if (brokers) {
      this.kafka = new Kafka({ brokers: brokers.split(',') });
      this.producer = this.kafka.producer();
      this.consumer = this.kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || 'app-group' });
    } else {
      this.logger.warn('KAFKA_BROKERS not set, Kafka disabled');
    }
  }

  async emit(topic: string, message: any) {
    if (!this.producer) return;
    await this.producer.connect();
    await this.producer.send({ topic, messages: [{ value: JSON.stringify(message) }] });
  }

  async consume(topic: string, handler: (payload: any) => Promise<void>) {
    if (!this.consumer) return;
    await this.consumer.connect();
    await this.consumer.subscribe({ topic, fromBeginning: false });
    await this.consumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        if (!message.value) return;
        try {
          const payload = JSON.parse(message.value.toString());
          await handler(payload);
        } catch (err) {
          this.logger.error(`Failed to handle message from ${topic}`, err as Error);
        }
      },
    });
  }
}
