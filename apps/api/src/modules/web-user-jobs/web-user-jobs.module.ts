import { StorageModule } from '@/shared/storage/storage.module';
import { WebRevalidationModule } from '@/modules/web-revalidation/web-revalidation.module';
import { Module } from '@nestjs/common';
import { WebUserCompaniesController } from './web-user-companies.controller';
import { WebUserCompaniesService } from './web-user-companies.service';
import { WebUserJobsController } from './web-user-jobs.controller';
import { WebUserJobsService } from './web-user-jobs.service';

@Module({
  imports: [StorageModule, WebRevalidationModule],
  controllers: [WebUserJobsController, WebUserCompaniesController],
  providers: [WebUserJobsService, WebUserCompaniesService],
})
export class WebUserJobsModule {}
