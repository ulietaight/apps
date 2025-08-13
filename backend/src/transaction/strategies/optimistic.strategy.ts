import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransferStrategy } from './transfer.strategy';

@Injectable()
export class OptimisticTransferStrategy implements TransferStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async transfer(senderId: number, receiverId: number, amount: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const sender = await tx.user.findUniqueOrThrow({ where: { id: senderId } });
      await tx.user.findUniqueOrThrow({ where: { id: receiverId } });
      if (Number(sender.balance) < amount) throw new Error('Insufficient funds');

      const updateSender = await tx.user.updateMany({
        where: { id: senderId, version: sender.version },
        data: { balance: { decrement: amount }, version: { increment: 1 } },
      });
      if (updateSender.count === 0) throw new Error('Optimistic lock conflict');

      await tx.user.update({ where: { id: receiverId }, data: { balance: { increment: amount } } });
      await tx.transaction.create({ data: { senderId, receiverId, amount, status: 'success' } });
    });
  }
}
