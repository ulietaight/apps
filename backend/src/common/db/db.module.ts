import {
  Global,
  Logger,
  Module,
  OnApplicationShutdown,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';

import { DataSource } from 'typeorm';

import { UserEntity } from './entities/user.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: async (
        configService: ConfigService,
      ): Promise<TypeOrmModuleOptions> => {
        return {
          type: 'postgres',

          host: configService.get<string>('POSTGRES_HOST'),
          port: configService.get<number>('POSTGRES_PORT'),
          username: configService.get<string>('POSTGRES_USER'),
          password: configService.get<string>('POSTGRES_PASSWORD'),
          database: configService.get<string>('POSTGRES_DB'),
          schema: configService.get<string>('POSTGRES_SCHEMA'),

          entities: [__dirname + '/../../**/*.entity.{js,ts}'],

          migrations: ['dist/src/common/db/migrations/*.js'],
          migrationsRun: configService.get<boolean>('POSTGRES_MIGRATIONS_RUN'),

          synchronize: false,

          logging: ['error'],

          ssl:
            configService.get<string>('POSTGRES_SSL') === 'true'
              ? { rejectUnauthorized: false }
              : false,
        };
      },
    }),

    TypeOrmModule.forFeature([UserEntity]),
  ],

  providers: [],

  exports: [
    TypeOrmModule.forFeature([UserEntity]),
  ],
})
export class DbModule implements OnModuleDestroy, OnApplicationShutdown {
  private logger = new Logger(DbModule.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleDestroy() {
    this.logger.log('[ModuleDestroy]: received shutdown command');
    await this.closeDatabaseConnection();
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(
      `[ApplicationShutdown]: ${
        signal ? `received signal - ${signal}` : 'before app start'
      }`,
    );
    await this.closeDatabaseConnection();
  }

  private async closeDatabaseConnection() {
    if (this.dataSource.isInitialized) {
      this.logger.log('Closing database connection');
      await this.dataSource.destroy();
    }
  }
}
