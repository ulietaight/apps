import { Inject, Injectable } from '@nestjs/common';
import { TransferStrategy } from './strategies/transfer.strategy';

@Injectable()
export class TransactionService {
  constructor(
    @Inject('TransferStrategy') private readonly strategy: TransferStrategy,
  ) {}

  async transfer(senderId: number, receiverId: number, amount: number) {
    return this.strategy.transfer(senderId, receiverId, amount);
  }
}
