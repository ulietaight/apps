import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransferStrategy } from './transfer.strategy';

const isoMap: Record<string, Prisma.TransactionIsolationLevel> = {
  'Read Uncommitted': 'ReadUncommitted',
  'Read Committed': 'ReadCommitted',
  'Repeatable Read': 'RepeatableRead',
  Serializable: 'Serializable',
};

@Injectable()
export class IsolationTransferStrategy implements TransferStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async transfer(senderId: number, receiverId: number, amount: number): Promise<void> {
    const levelStr = process.env.ISOLATION_LEVEL || 'Read Committed';
    const isolationLevel = isoMap[levelStr] ?? 'ReadCommitted';

    await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const sender = await tx.user.findUniqueOrThrow({ where: { id: senderId } });
        await tx.user.findUniqueOrThrow({ where: { id: receiverId } });
        if (Number(sender.balance) < amount) throw new Error('Insufficient funds');

        await tx.user.update({ where: { id: senderId }, data: { balance: { decrement: amount } } });
        await tx.user.update({ where: { id: receiverId }, data: { balance: { increment: amount } } });
        await tx.transaction.create({ data: { senderId, receiverId, amount, status: 'success' } });
      },
      { isolationLevel },
    );
  }
}
