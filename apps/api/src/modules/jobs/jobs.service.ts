import { PrismaService } from '@/database/prisma.service';
import { AUDIT_ACTIONS } from '@/modules/audit/audit.constant';
import { AuditContext, AuditService } from '@/modules/audit/audit.service';
import { JobStatus, UpdateJobInput } from '@careerslk/types';
import { Injectable } from '@nestjs/common';

interface JobFilters {
  company?: string;
  companyId?: number;
  status?: JobStatus;
  sector?: string;
}

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(filters: JobFilters) {
    const where = {
      status: filters.status,
      companyId: filters.companyId,
      sector: filters.sector,
      company: filters.company ? { name: filters.company } : undefined,
      deletedAt: null,
    };
    return await this.prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true, logoUrl: true } },
      },
    });
  }

  async findOne(id: number) {
    return await this.prisma.job.findFirstOrThrow({
      where: { id, deletedAt: null },
      include: {
        company: true,
        keywords: {
          select: {
            keywordId: true,
            editedByAdmin: true,
            keyword: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdateJobInput, context: AuditContext) {
    return await this.prisma.$transaction(async (tx) => {
      const before = await tx.job.findFirstOrThrow({
        where: { id, deletedAt: null },
      });

      const job = await tx.job.update({ where: { id }, data: { ...dto } });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.JOB_UPDATED,
          entityType: 'job',
          entityId: job.id,
          oldValue: { title: before.title, status: before.status },
          newValue: { title: job.title, status: job.status },
        },
        tx,
      );

      return job;
    });
  }

  async softDelete(id: number, context: AuditContext) {
    return await this.prisma.$transaction(async (tx) => {
      const job = await tx.job.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.JOB_DELETED,
          entityType: 'job',
          entityId: job.id,
          oldValue: { title: job.title },
        },
        tx,
      );

      return job;
    });
  }
}
