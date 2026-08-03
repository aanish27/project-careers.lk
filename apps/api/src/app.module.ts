import configuration from '@/config';
import { envValidationSchema } from '@/config/env.validation';
import { DatabaseModule } from '@/database/database.module';
import { AdminUsersModule } from '@/modules/admin-users/admin-users.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { ScraperModule } from '@/modules/scraper/scraper.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import IORedis from 'ioredis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AiBatchLogsModule } from './modules/ai-batch-logs/ai-batch-logs.module';
import { AiCostModule } from './modules/ai-cost/ai-cost.module';
import { AiLogsModule } from './modules/ai-logs/ai-logs.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { KeywordsModule } from './modules/keywords/keywords.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PublicCompaniesModule } from './modules/public-companies/public-companies.module';
import { PublicJobsModule } from './modules/public-jobs/public-jobs.module';
import { QueueLogsModule } from './modules/queue-logs/queue-logs.module';
import { ScrapeLogsModule } from './modules/scrape-logs/scrape-logs.module';
import { SeoAdminModule } from './modules/seo-admin/seo-admin.module';
import { SeoModule } from './modules/seo/seo.module';
import { WebUserAuthModule } from './modules/web-user-auth/web-user-auth.module';
import { WebUsersModule } from './modules/web-users/web-users.module';
import { StorageModule } from './shared/storage/storage.module';

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
            path: '',
            module: AdminUsersModule,
          },
          {
            path: '',
            module: RbacModule,
          },
          {
            path: '',
            module: ScraperModule,
          },
          {
            path: '',
            module: CompaniesModule,
          },
          {
            path: '',
            module: JobsModule,
          },
          {
            path: '',
            module: ScrapeLogsModule,
          },
          {
            path: '',
            module: AuditLogsModule,
          },
          {
            path: '',
            module: AiLogsModule,
          },
          {
            path: '',
            module: AiBatchLogsModule,
          },
          {
            path: '',
            module: QueueLogsModule,
          },
          {
            path: '',
            module: KeywordsModule,
          },
          {
            path: '',
            module: DashboardModule,
          },
          {
            path: '',
            module: NotificationsModule,
          },
          {
            path: '',
            module: AiCostModule,
          },
          {
            path: '',
            module: SeoAdminModule,
          },
        ],
      },
    ]),
    AdminUsersModule,
    RbacModule,
    CompaniesModule,
    ScraperModule,
    JobsModule,
    KeywordsModule,
    ScrapeLogsModule,
    AuditLogsModule,
    AiLogsModule,
    AiBatchLogsModule,
    QueueLogsModule,
    DashboardModule,
    NotificationsModule,
    AiCostModule,
    SeoAdminModule,
    SeoModule,
    PublicJobsModule,
    PublicCompaniesModule,
    WebUsersModule,
    WebUserAuthModule,
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
