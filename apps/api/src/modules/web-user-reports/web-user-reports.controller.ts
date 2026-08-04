import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { WebUserJwtAuthGuard } from '@/modules/web-user-auth/guards/web-user-jwt-auth.guard';
import { FileReportInput, fileReportSchema } from '@careerslk/types';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { WebUserReportsService } from './web-user-reports.service';

@Controller('web-users/reports')
@Public()
@UseGuards(WebUserJwtAuthGuard)
export class WebUserReportsController {
  constructor(private readonly webUserReportsService: WebUserReportsService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  file(
    @CurrentUser('webUserId') webUserId: number,
    @Body(new ZodValidationPipe(fileReportSchema)) dto: FileReportInput,
  ) {
    return this.webUserReportsService.file(webUserId, dto);
  }
}
