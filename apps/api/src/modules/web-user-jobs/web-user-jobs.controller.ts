import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { WebUserJwtAuthGuard } from '@/modules/web-user-auth/guards/web-user-jwt-auth.guard';
import {
  postJobRequestSchema,
  UpdateWebUserJobInput,
  updateWebUserJobSchema,
} from '@careerslk/types';
import {
  BadRequestException,
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

  // Always multipart — the client sends the structured company/job data as
  // a JSON string in `payload` (a plain `@Body()` can't carry both a typed
  // JSON shape and a file in the same request) plus an optional `file`.
  @Post()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @UseInterceptors(FileInterceptor('file'))
  submit(
    @CurrentUser('webUserId') webUserId: number,
    @Body('payload') payloadRaw: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payloadRaw);
    } catch {
      throw new BadRequestException('Invalid request payload');
    }

    const dto = new ZodValidationPipe(postJobRequestSchema).transform(parsed);
    return this.webUserJobsService.submit(webUserId, dto, file);
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

  @Delete(':id/profile')
  removeFromProfile(
    @CurrentUser('webUserId') webUserId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.webUserJobsService.removeFromProfile(webUserId, id);
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

  @Get(':id/save')
  async isSaved(
    @CurrentUser('webUserId') webUserId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return { saved: await this.webUserJobsService.isSaved(webUserId, id) };
  }
}
