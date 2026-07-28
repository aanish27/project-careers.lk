import { AuditModule } from '@/modules/audit/audit.module';
import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [AuditModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
