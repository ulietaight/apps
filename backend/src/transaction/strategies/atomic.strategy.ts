import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransferStrategy } from './transfer.strategy';

@Injectable()
export class AtomicTransferStrategy implements TransferStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async transfer(senderId: number, receiverId: number, amount: number) {
    const sender = await this.prisma.user.findUniqueOrThrow({
      where: { id: senderId },
    });
    const receiver = await this.prisma.user.findUniqueOrThrow({
      where: { id: receiverId },
    });

    if (new Decimal(sender.balance).lt(new Decimal(amount))) {
      throw new Error('Insufficient funds');
    }

    await this.prisma.user.update({
      where: { id: senderId },
      data: { balance: { decrement: amount } },
    });

    await this.prisma.user.update({
      where: { id: receiverId },
      data: { balance: { increment: amount } },
    });

    await this.prisma.transaction.create({
      data: { senderId, receiverId, amount, status: 'success' },
    });
  }
}