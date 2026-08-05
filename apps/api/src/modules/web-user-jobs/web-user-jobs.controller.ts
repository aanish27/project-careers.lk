import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { WebUserJwtAuthGuard } from '@/modules/web-user-auth/guards/web-user-jwt-auth.guard';
import {
  CreateWebUserJobInput,
  createWebUserJobSchema,
  UpdateWebUserJobInput,
  updateWebUserJobSchema,
} from '@careerslk/types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { WebUserJobsService } from './web-user-jobs.service';

@Controller('web-users/jobs')
@Public()
@UseGuards(WebUserJwtAuthGuard)
export class WebUserJobsController {
  constructor(private readonly webUserJobsService: WebUserJobsService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  submit(
    @CurrentUser('webUserId') webUserId: number,
    @Body(new ZodValidationPipe(createWebUserJobSchema))
    dto: CreateWebUserJobInput,
  ) {
    return this.webUserJobsService.submit(webUserId, dto);
  }

  @Get('mine')
  findMine(@CurrentUser('webUserId') webUserId: number) {
    return this.webUserJobsService.findMine(webUserId);
  }

  @Get('saved')
  findSaved(@CurrentUser('webUserId') webUserId: number) {
    return this.webUserJobsService.findSaved(webUserId);
  }

  @Patch(':id')
  update(
    @CurrentUser('webUserId') webUserId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateWebUserJobSchema))
    dto: UpdateWebUserJobInput,
  ) {
    return this.webUserJobsService.update(webUserId, id, dto);
  }

  @Post(':id/image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @CurrentUser('webUserId') webUserId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.webUserJobsService.uploadImage(webUserId, id, file);
  }

  @Delete(':id')
  withdraw(
    @CurrentUser('webUserId') webUserId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.webUserJobsService.withdraw(webUserId, id);
  }

  @Post(':id/save')
  save(
    @CurrentUser('webUserId') webUserId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.webUserJobsService.save(webUserId, id);
  }

  @Delete(':id/save')
  unsave(
    @CurrentUser('webUserId') webUserId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.webUserJobsService.unsave(webUserId, id);
  }
}
