import { AuditModule } from '@/modules/audit/audit.module';
import { WebRevalidationModule } from '@/modules/web-revalidation/web-revalidation.module';
import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [AuditModule, WebRevalidationModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
