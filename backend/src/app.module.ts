import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './common/db/db.module';
import { UserModule } from './domains/user/user.module';
import { AuthModule } from './domains/auth/auth.module';
import { envValidationSchema } from './common/config/env';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object(envValidationSchema),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      },
    }),
    DbModule,
    UserModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
