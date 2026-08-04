import { PrismaService } from '@/database/prisma.service';
import { AUDIT_ACTIONS } from '@/modules/audit/audit.constant';
import { AuditContext, AuditService } from '@/modules/audit/audit.service';
import { AbuseReportStatus, ResolveReportInput } from '@careerslk/types';
import { Injectable } from '@nestjs/common';
import { FilterReportsDto } from './dto/filters.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(filters: FilterReportsDto) {
    return this.prisma.abuseReport.findMany({
      where: {
        status: filters.status,
        entityType: filters.entityType,
        category: filters.category,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.abuseReport.findFirstOrThrow({
      where: { id },
      include: {
        reporter: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async review(id: number, dto: ResolveReportInput, context: AuditContext) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.abuseReport.findFirstOrThrow({ where: { id } });

      const report = await tx.abuseReport.update({
        where: { id },
        data: {
          status: AbuseReportStatus.REVIEWED,
          reviewedByAdminId: context.actorUserId,
          reviewedAt: new Date(),
          resolutionNotes: dto.resolutionNotes ?? null,
        },
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.REPORT_REVIEWED,
          entityType: 'abuse_report',
          entityId: report.id,
          oldValue: { status: before.status },
          newValue: { status: report.status },
        },
        tx,
      );

      return report;
    });
  }

  async dismiss(id: number, dto: ResolveReportInput, context: AuditContext) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.abuseReport.findFirstOrThrow({ where: { id } });

      const report = await tx.abuseReport.update({
        where: { id },
        data: {
          status: AbuseReportStatus.DISMISSED,
          reviewedByAdminId: context.actorUserId,
          reviewedAt: new Date(),
          resolutionNotes: dto.resolutionNotes ?? null,
        },
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.REPORT_DISMISSED,
          entityType: 'abuse_report',
          entityId: report.id,
          oldValue: { status: before.status },
          newValue: { status: report.status },
        },
        tx,
      );

      return report;
    });
  }
}
