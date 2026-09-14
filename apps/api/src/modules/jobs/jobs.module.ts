import { AuditModule } from '@/modules/audit/audit.module';
import { WebRevalidationModule } from '@/modules/web-revalidation/web-revalidation.module';
import { WebUserNotificationsModule } from '@/modules/web-user-notifications/web-user-notifications.module';
import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [AuditModule, WebRevalidationModule, WebUserNotificationsModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
