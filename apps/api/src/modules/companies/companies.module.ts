import { AuditModule } from '@/modules/audit/audit.module';
import { MailModule } from '@/shared/mail/mail.module';
import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';

@Module({
  imports: [AuditModule, MailModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
})
export class CompaniesModule {}
