import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { WebUserJwtAuthGuard } from '@/modules/web-user-auth/guards/web-user-jwt-auth.guard';
import {
  CreateGigInput,
  createGigSchema,
  UpdateGigInput,
  updateGigSchema,
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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { WebUserGigsService } from './web-user-gigs.service';

@Controller('web-users/gigs')
@Public()
@UseGuards(WebUserJwtAuthGuard)
export class WebUserGigsController {
  constructor(private readonly webUserGigsService: WebUserGigsService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  submit(
    @CurrentUser('webUserId') webUserId: number,
    @Body(new ZodValidationPipe(createGigSchema)) dto: CreateGigInput,
  ) {
    return this.webUserGigsService.submit(webUserId, dto);
  }

  @Get('mine')
  findMine(@CurrentUser('webUserId') webUserId: number) {
    return this.webUserGigsService.findMine(webUserId);
  }

  @Patch(':id')
  update(
    @CurrentUser('webUserId') webUserId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateGigSchema)) dto: UpdateGigInput,
  ) {
    return this.webUserGigsService.update(webUserId, id, dto);
  }

  @Delete(':id')
  withdraw(
    @CurrentUser('webUserId') webUserId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.webUserGigsService.withdraw(webUserId, id);
  }

  @Post(':id/attachments')
  @UseInterceptors(FilesInterceptor('files', 3))
  uploadAttachments(
    @CurrentUser('webUserId') webUserId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.webUserGigsService.uploadAttachments(webUserId, id, files);
  }
}
