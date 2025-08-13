import { Inject, Injectable } from '@nestjs/common';
import { TransferStrategy } from './strategies/transfer.strategy';
import type Redis from 'ioredis';

@Injectable()
export class TransactionService {
  constructor(
    @Inject('TransferStrategy') private readonly strategy: TransferStrategy,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async transfer(senderId: number, receiverId: number, amount: number) {
    await this.strategy.transfer(senderId, receiverId, amount);
    // Invalidate balance cache for both users after successful transfer
    await this.redis.del(`user:${senderId}:balance`);
    await this.redis.del(`user:${receiverId}:balance`);
  }
}
