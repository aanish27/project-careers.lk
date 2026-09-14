import { AuditModule } from '@/modules/audit/audit.module';
import { WebUserNotificationsModule } from '@/modules/web-user-notifications/web-user-notifications.module';
import { MailModule } from '@/shared/mail/mail.module';
import { StorageModule } from '@/shared/storage/storage.module';
import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';

@Module({
  imports: [AuditModule, MailModule, WebUserNotificationsModule, StorageModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
})
export class CompaniesModule {}
