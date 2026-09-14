import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { WebUserJwtAuthGuard } from '@/modules/web-user-auth/guards/web-user-jwt-auth.guard';
import {
  CreateWebUserCompanyInput,
  createWebUserCompanySchema,
  UpdateWebUserCompanyInput,
  updateWebUserCompanySchema,
} from '@careerslk/types';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WebUserCompaniesService } from './web-user-companies.service';

@Controller('web-users/companies')
@Public()
@UseGuards(WebUserJwtAuthGuard)
export class WebUserCompaniesController {
  constructor(
    private readonly webUserCompaniesService: WebUserCompaniesService,
  ) {}

  @Post()
  create(
    @CurrentUser('webUserId') webUserId: number,
    @Body(new ZodValidationPipe(createWebUserCompanySchema))
    dto: CreateWebUserCompanyInput,
  ) {
    return this.webUserCompaniesService.create(webUserId, dto);
  }

  // Must be registered before ':id'-shaped routes below it in this
  // controller — Nest/Express match in registration order, and 'me' would
  // otherwise be swallowed. There are no ':id' routes here yet, but keeping
  // literal routes first matches the convention used in CompaniesController.
  @Get('search')
  search(@Query('q') q: string) {
    return this.webUserCompaniesService.search(q ?? '');
  }

  @Get('me')
  getMine(@CurrentUser('webUserId') webUserId: number) {
    return this.webUserCompaniesService.getMine(webUserId);
  }

  @Patch('me')
  updateMine(
    @CurrentUser('webUserId') webUserId: number,
    @Body(new ZodValidationPipe(updateWebUserCompanySchema))
    dto: UpdateWebUserCompanyInput,
  ) {
    return this.webUserCompaniesService.updateMine(webUserId, dto);
  }

  @Post('me/logo')
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @CurrentUser('webUserId') webUserId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.webUserCompaniesService.uploadLogo(webUserId, file);
  }

  @Post('me/br-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadBrImage(
    @CurrentUser('webUserId') webUserId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.webUserCompaniesService.uploadBrImage(webUserId, file);
  }

  @Post('me/request-auto-approval')
  requestAutoApproval(@CurrentUser('webUserId') webUserId: number) {
    return this.webUserCompaniesService.requestAutoApproval(webUserId);
  }

  @Post(':id/claim')
  claim(
    @CurrentUser('webUserId') webUserId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.webUserCompaniesService.claim(webUserId, id);
  }
}
