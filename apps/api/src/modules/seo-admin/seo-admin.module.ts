import { AuditModule } from '@/modules/audit/audit.module';
import { SeoModule } from '@/modules/seo/seo.module';
import { Module } from '@nestjs/common';
import { SeoAdminController } from './seo-admin.controller';

@Module({
  imports: [AuditModule, SeoModule],
  controllers: [SeoAdminController],
})
export class SeoAdminModule {}
