import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';

import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';

async function bootstrap() {
  const adapter = new FastifyAdapter();

  adapter.register(fastifyCors, {
    origin: true,
    credentials: true,
  });

  adapter.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    { bufferLogs: true },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  app.useLogger(app.get(Logger));

  await app.listen(
    process.env.PORT ? Number(process.env.PORT) : 3000,
    '0.0.0.0',
  );
}

bootstrap();
