import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransferStrategy } from './transfer.strategy';

@Injectable()
export class NoTxTransferStrategy implements TransferStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async transfer(senderId: number, receiverId: number, amount: number): Promise<void> {
    // Explicitly avoid wrapping in a database transaction
    const sender = await this.prisma.user.findUniqueOrThrow({ where: { id: senderId } });
    await this.prisma.user.findUniqueOrThrow({ where: { id: receiverId } });
    if (Number(sender.balance) < amount) throw new Error('Insufficient funds');

    await this.prisma.user.update({ where: { id: senderId }, data: { balance: { decrement: amount } } });
    await this.prisma.user.update({ where: { id: receiverId }, data: { balance: { increment: amount } } });
    await this.prisma.transaction.create({ data: { senderId, receiverId, amount, status: 'success' } });
  }
}
