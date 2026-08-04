import { AuditModule } from '@/modules/audit/audit.module';
import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuditModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
