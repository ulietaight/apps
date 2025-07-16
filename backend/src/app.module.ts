import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UserModule } from './user/user.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    TransactionModule,
    //RedisModule,
    // другие модули позже (user, transaction и т.п.)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
