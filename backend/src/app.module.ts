import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UserModule } from './user/user.module';
import { TransactionModule } from './transaction/transaction.module';
import { RiotModule } from './riot/riot.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UserModule,
    TransactionModule,
    RedisModule,
    RiotModule,
    // другие модули позже (user, transaction и т.п.)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
