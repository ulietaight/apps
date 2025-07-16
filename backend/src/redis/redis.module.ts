import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

const redisProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => {
    return new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
  },
};

@Global()
@Module({
  providers: [redisProvider],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}