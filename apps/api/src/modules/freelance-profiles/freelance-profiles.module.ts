import { AuditModule } from '@/modules/audit/audit.module';
import { Module } from '@nestjs/common';
import { FreelanceProfilesController } from './freelance-profiles.controller';
import { FreelanceProfilesService } from './freelance-profiles.service';

@Module({
  imports: [AuditModule],
  controllers: [FreelanceProfilesController],
  providers: [FreelanceProfilesService],
})
export class FreelanceProfilesModule {}
