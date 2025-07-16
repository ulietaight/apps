import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async createTransaction(dto: CreateTransactionDto) {
    const { senderId, receiverId, amount } = dto;

    if (senderId === receiverId) {
      throw new Error('Sender and receiver must be different');
    }

    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
    });
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!sender || !receiver) {
      throw new Error('User not found');
    }

    if (new Decimal(sender.balance).lessThan(amount)) {
      throw new Error('Insufficient funds');
    }

    // простая транзакция: списать и начислить
    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: senderId },
        data: { balance: { decrement: amount } },
      });

      await tx.user.update({
        where: { id: receiverId },
        data: { balance: { increment: amount } },
      });

      return tx.transaction.create({
        data: {
          senderId,
          receiverId,
          amount,
          status: 'success',
        },
      });
    });
  }
}
