import { AuditModule } from '@/modules/audit/audit.module';
import { Module } from '@nestjs/common';
import { GigsController } from './gigs.controller';
import { GigsService } from './gigs.service';

@Module({
  imports: [AuditModule],
  controllers: [GigsController],
  providers: [GigsService],
})
export class GigsModule {}
