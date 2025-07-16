import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(name: string) {
    return this.prisma.user.create({
      data: {
        name,
      },
    });
  }

  async getBalance(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new Error('User not found');
    }

    return {
      balance: user.balance,
    };
  }
}