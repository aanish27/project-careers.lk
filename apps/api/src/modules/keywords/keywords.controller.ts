import {
  CurrentPrincipal,
  RequirePermissions,
} from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { AuditContext } from '@/modules/audit/audit.service';
import type { AuthenticatedPrincipal } from '@/modules/auth/interfaces/jwt-payload.interface';
import { PERMISSIONS } from '@careerslk/lib';
import {
  AssignJobKeywordInput,
  assignJobKeywordSchema,
  CreateKeywordInput,
  createKeywordSchema,
  UpdateJobKeywordInput,
  updateJobKeywordSchema,
  UpdateKeywordInput,
  updateKeywordSchema,
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
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { KeywordsService } from './keywords.service';

@Controller('keywords')
@UseGuards(PermissionsGuard)
export class KeywordsController {
  constructor(private readonly keywordsService: KeywordsService) {}

  private auditContext(
    principal: AuthenticatedPrincipal,
    req: Request,
  ): AuditContext {
    return {
      actorUserId: principal.userId,
      actorEmail: principal.email,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent']?.slice(0, 255) ?? null,
    };
  }

  @Post()
  @RequirePermissions(PERMISSIONS.KEYWORDS_CREATE)
  create(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Body(new ZodValidationPipe(createKeywordSchema)) dto: CreateKeywordInput,
    @Req() req: Request,
  ) {
    return this.keywordsService.create(dto, this.auditContext(actor, req));
  }

  @Get()
  @RequirePermissions(PERMISSIONS.KEYWORDS_READ)
  findAll() {
    return this.keywordsService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.KEYWORDS_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.keywordsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.KEYWORDS_UPDATE)
  update(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateKeywordSchema)) dto: UpdateKeywordInput,
    @Req() req: Request,
  ) {
    return this.keywordsService.update(id, dto, this.auditContext(actor, req));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.KEYWORDS_DELETE)
  remove(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.keywordsService.remove(id, this.auditContext(actor, req));
  }

  @Post('jobs/:jobId')
  @RequirePermissions(PERMISSIONS.KEYWORDS_ASSIGN)
  assignToJob(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('jobId', ParseIntPipe) jobId: number,
    @Body(new ZodValidationPipe(assignJobKeywordSchema))
    dto: AssignJobKeywordInput,
    @Req() req: Request,
  ) {
    return this.keywordsService.assignToJob(
      jobId,
      dto,
      this.auditContext(actor, req),
    );
  }

  @Patch('jobs/:jobId/:keywordId')
  @RequirePermissions(PERMISSIONS.KEYWORDS_ASSIGN)
  updateJobKeyword(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('jobId', ParseIntPipe) jobId: number,
    @Param('keywordId', ParseIntPipe) keywordId: number,
    @Body(new ZodValidationPipe(updateJobKeywordSchema))
    dto: UpdateJobKeywordInput,
    @Req() req: Request,
  ) {
    return this.keywordsService.updateJobKeyword(
      jobId,
      keywordId,
      dto,
      this.auditContext(actor, req),
    );
  }

  @Delete('jobs/:jobId/:keywordId')
  @RequirePermissions(PERMISSIONS.KEYWORDS_ASSIGN)
  removeJobKeyword(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('jobId', ParseIntPipe) jobId: number,
    @Param('keywordId', ParseIntPipe) keywordId: number,
    @Req() req: Request,
  ) {
    return this.keywordsService.removeJobKeyword(
      jobId,
      keywordId,
      this.auditContext(actor, req),
    );
  }
}
