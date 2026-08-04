import { Module } from '@nestjs/common';
import { WebUserReportsController } from './web-user-reports.controller';
import { WebUserReportsService } from './web-user-reports.service';

@Module({
  controllers: [WebUserReportsController],
  providers: [WebUserReportsService],
})
export class WebUserReportsModule {}
