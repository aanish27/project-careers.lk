import configuration from '@/config';
import { envValidationSchema } from '@/config/env.validation';
import { DatabaseModule } from '@/database/database.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { ScraperModule } from '@/modules/scraper/scraper.module';
import { UsersModule } from '@/modules/users/users.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import IORedis from 'ioredis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { StorageModule } from './shared/storage/storage.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { KeywordsModule } from './modules/keywords/keywords.module';
import { ScrapeLogsModule } from './modules/scrape-logs/scrape-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: new IORedis(config.getOrThrow<string>('REDIS_URL'), {
          maxRetriesPerRequest: null,
        }),
      }),
    }),
    DatabaseModule,
    AuthModule,
    StorageModule,
    RouterModule.register([
      {
        path: 'admin',
        children: [
          {
            path: 'scraper',
            module: ScraperModule,
          },
          {
            path: 'users',
            module: UsersModule,
          },
          {
            path: 'companies',
            module: UsersModule,
          },
        ],
      },
    ]),
    CompaniesModule,
    JobsModule,
    KeywordsModule,
    ScrapeLogsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
