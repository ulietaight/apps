import { Global, Module } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (): RedisClient => {
        const url = process.env.REDIS_URL;
        const client = url
          ? new Redis(url, {
              maxRetriesPerRequest: 3,
              enableOfflineQueue: false,
              connectionName: 'apps-backend',
            })
          : new Redis({
              host: process.env.REDIS_HOST || 'redis',
              port: Number(process.env.REDIS_PORT || 6379),
              password: process.env.REDIS_PASSWORD || undefined,
              maxRetriesPerRequest: 3,
              enableOfflineQueue: false,
              connectionName: 'apps-backend',
            });

        client.on('error', (e) => console.error('[redis] error:', e.message));
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
