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
import { FreelanceProfilesModule } from './modules/freelance-profiles/freelance-profiles.module';
import { GigsModule } from './modules/gigs/gigs.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { KeywordsModule } from './modules/keywords/keywords.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PublicCompaniesModule } from './modules/public-companies/public-companies.module';
import { PublicFreelanceProfilesModule } from './modules/public-freelance-profiles/public-freelance-profiles.module';
import { PublicGigsModule } from './modules/public-gigs/public-gigs.module';
import { PublicJobsModule } from './modules/public-jobs/public-jobs.module';
import { QueueLogsModule } from './modules/queue-logs/queue-logs.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ScrapeLogsModule } from './modules/scrape-logs/scrape-logs.module';
import { SeoAdminModule } from './modules/seo-admin/seo-admin.module';
import { SeoModule } from './modules/seo/seo.module';
import { WebUserAuthModule } from './modules/web-user-auth/web-user-auth.module';
import { WebUserBlocksModule } from './modules/web-user-blocks/web-user-blocks.module';
import { WebUserChatModule } from './modules/web-user-chat/web-user-chat.module';
import { WebUserFreelanceModule } from './modules/web-user-freelance/web-user-freelance.module';
import { WebUserJobsModule } from './modules/web-user-jobs/web-user-jobs.module';
import { WebUserNotificationsModule } from './modules/web-user-notifications/web-user-notifications.module';
import { WebUserReportsModule } from './modules/web-user-reports/web-user-reports.module';
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
          {
            path: '',
            module: FreelanceProfilesModule,
          },
          {
            path: '',
            module: GigsModule,
          },
          {
            path: '',
            module: ReportsModule,
          },
        ],
      },
    ]),
    AdminUsersModule,
    RbacModule,
    CompaniesModule,
    ScraperModule,
    JobsModule,
    FreelanceProfilesModule,
    GigsModule,
    ReportsModule,
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
    PublicFreelanceProfilesModule,
    PublicGigsModule,
    WebUsersModule,
    WebUserAuthModule,
    WebUserJobsModule,
    WebUserNotificationsModule,
    WebUserFreelanceModule,
    WebUserBlocksModule,
    WebUserChatModule,
    WebUserReportsModule,
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
