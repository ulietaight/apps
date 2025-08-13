import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransferStrategy } from './transfer.strategy';

@Injectable()
export class PessimisticTransferStrategy implements TransferStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async transfer(senderId: number, receiverId: number, amount: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Lock sender row FOR UPDATE via raw SQL
      const sender: any[] = await tx.$queryRaw<any[]>`SELECT * FROM "User" WHERE id = ${senderId} FOR UPDATE`;
      if (!sender?.[0]) throw new Error('Sender not found');

      if (Number(sender[0].balance) < amount) throw new Error('Insufficient funds');

      await tx.user.update({ where: { id: senderId }, data: { balance: { decrement: amount } } });
      await tx.user.update({ where: { id: receiverId }, data: { balance: { increment: amount } } });

      await tx.transaction.create({ data: { senderId, receiverId, amount, status: 'success' } });
    });
  }
}
