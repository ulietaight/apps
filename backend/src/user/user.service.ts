import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type Redis from 'ioredis';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async createUser(name: string) {
    return this.prisma.user.create({
      data: {
        name,
      },
    });
  }

  async getBalance(userId: number) {
    const cacheKey = `user:${userId}:balance`;
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) {
      return { balance: Number(cached) };
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    await this.redis.setex(cacheKey, 300, String(user.balance));
    return { balance: user.balance };
  }
}