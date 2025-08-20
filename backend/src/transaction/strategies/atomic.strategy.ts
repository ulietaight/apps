import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import type { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransferStrategy } from './transfer.strategy';

@Injectable()
export class AtomicTransferStrategy implements TransferStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async transfer(senderId: number, receiverId: number, amount: number) {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const sender = await tx.user.findUniqueOrThrow({ where: { id: senderId } });
      await tx.user.findUniqueOrThrow({ where: { id: receiverId } });

      if (new Decimal(sender.balance).lt(new Decimal(amount))) {
        throw new Error('Insufficient funds');
      }

      await tx.user.update({ where: { id: senderId }, data: { balance: { decrement: amount } } });
      await tx.user.update({ where: { id: receiverId }, data: { balance: { increment: amount } } });
      await tx.transaction.create({ data: { senderId, receiverId, amount, status: 'success' } });
    });
  }
}