import { PrismaService } from '@/database/prisma.service';
import { AUDIT_ACTIONS } from '@/modules/audit/audit.constant';
import { AuditContext, AuditService } from '@/modules/audit/audit.service';
import {
  AssignJobKeywordInput,
  CreateKeywordInput,
  UpdateJobKeywordInput,
  UpdateKeywordInput,
} from '@careerslk/types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class KeywordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateKeywordInput, context: AuditContext) {
    return await this.prisma.$transaction(async (tx) => {
      const keyword = await tx.keyword.create({ data: { name: dto.name } });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.KEYWORD_CREATED,
          entityType: 'keyword',
          entityId: keyword.id,
          newValue: { name: keyword.name },
        },
        tx,
      );

      return keyword;
    });
  }

  async findAll() {
    return await this.prisma.keyword.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, _count: { select: { jobs: true } } },
    });
  }

  async findOne(id: number) {
    return await this.prisma.keyword.findUniqueOrThrow({
      where: { id },
      include: { jobs: { include: { job: true } } },
    });
  }

  async update(id: number, dto: UpdateKeywordInput, context: AuditContext) {
    return await this.prisma.$transaction(async (tx) => {
      const before = await tx.keyword.findUniqueOrThrow({ where: { id } });

      const keyword = await tx.keyword.update({
        where: { id },
        data: { name: dto.name },
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.KEYWORD_UPDATED,
          entityType: 'keyword',
          entityId: keyword.id,
          oldValue: { name: before.name },
          newValue: { name: keyword.name },
        },
        tx,
      );

      return keyword;
    });
  }

  async remove(id: number, context: AuditContext) {
    return await this.prisma.$transaction(async (tx) => {
      const keyword = await tx.keyword.delete({ where: { id } });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.KEYWORD_DELETED,
          entityType: 'keyword',
          entityId: id,
          oldValue: { name: keyword.name },
        },
        tx,
      );

      return keyword;
    });
  }

  async assignToJob(
    jobId: number,
    dto: AssignJobKeywordInput,
    context: AuditContext,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const keyword = await tx.keyword.upsert({
        where: { name: dto.name },
        update: {},
        create: { name: dto.name },
      });

      const jobKeyword = await tx.jobKeyword.upsert({
        where: { jobId_keywordId: { jobId, keywordId: keyword.id } },
        update: { editedByAdmin: dto.editedByAdmin ?? false },
        create: {
          jobId,
          keywordId: keyword.id,
          editedByAdmin: dto.editedByAdmin ?? false,
        },
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.JOB_KEYWORD_ASSIGNED,
          entityType: 'job_keyword',
          entityId: `${jobId}:${keyword.id}`,
          newValue: { jobId, keyword: keyword.name },
        },
        tx,
      );

      return jobKeyword;
    });
  }

  async updateJobKeyword(
    jobId: number,
    keywordId: number,
    dto: UpdateJobKeywordInput,
    context: AuditContext,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const jobKeyword = await tx.jobKeyword.update({
        where: { jobId_keywordId: { jobId, keywordId } },
        data: { editedByAdmin: dto.editedByAdmin },
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.JOB_KEYWORD_UPDATED,
          entityType: 'job_keyword',
          entityId: `${jobId}:${keywordId}`,
          newValue: { editedByAdmin: jobKeyword.editedByAdmin },
        },
        tx,
      );

      return jobKeyword;
    });
  }

  async removeJobKeyword(
    jobId: number,
    keywordId: number,
    context: AuditContext,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const jobKeyword = await tx.jobKeyword.delete({
        where: { jobId_keywordId: { jobId, keywordId } },
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.JOB_KEYWORD_REMOVED,
          entityType: 'job_keyword',
          entityId: `${jobId}:${keywordId}`,
        },
        tx,
      );

      return jobKeyword;
    });
  }
}
