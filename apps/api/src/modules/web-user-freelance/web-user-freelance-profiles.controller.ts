import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { WebUserJwtAuthGuard } from '@/modules/web-user-auth/guards/web-user-jwt-auth.guard';
import {
  CreateFreelanceProfileInput,
  createFreelanceProfileSchema,
  UpdateFreelanceProfileInput,
  updateFreelanceProfileSchema,
} from '@careerslk/types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { WebUserFreelanceProfilesService } from './web-user-freelance-profiles.service';

@Controller('web-users/freelance-profiles')
@Public()
@UseGuards(WebUserJwtAuthGuard)
export class WebUserFreelanceProfilesController {
  constructor(
    private readonly webUserFreelanceProfilesService: WebUserFreelanceProfilesService,
  ) {}

  @Post()
  create(
    @CurrentUser('webUserId') webUserId: number,
    @Body(new ZodValidationPipe(createFreelanceProfileSchema))
    dto: CreateFreelanceProfileInput,
  ) {
    return this.webUserFreelanceProfilesService.create(webUserId, dto);
  }

  @Get('me')
  getMine(@CurrentUser('webUserId') webUserId: number) {
    return this.webUserFreelanceProfilesService.getMine(webUserId);
  }

  @Patch('me')
  updateMine(
    @CurrentUser('webUserId') webUserId: number,
    @Body(new ZodValidationPipe(updateFreelanceProfileSchema))
    dto: UpdateFreelanceProfileInput,
  ) {
    return this.webUserFreelanceProfilesService.updateMine(webUserId, dto);
  }

  @Delete('me')
  withdraw(@CurrentUser('webUserId') webUserId: number) {
    return this.webUserFreelanceProfilesService.withdraw(webUserId);
  }

  @Post('me/cv')
  @UseInterceptors(FileInterceptor('file'))
  uploadCv(
    @CurrentUser('webUserId') webUserId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.webUserFreelanceProfilesService.uploadCv(webUserId, file);
  }

  @Post('me/portfolio-files')
  @UseInterceptors(FilesInterceptor('files', 5))
  uploadPortfolioFiles(
    @CurrentUser('webUserId') webUserId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.webUserFreelanceProfilesService.uploadPortfolioFiles(
      webUserId,
      files,
    );
  }
}
