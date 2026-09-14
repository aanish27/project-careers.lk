import { PrismaService } from '@/database/prisma.service';
import { AUDIT_ACTIONS } from '@/modules/audit/audit.constant';
import { AuditContext, AuditService } from '@/modules/audit/audit.service';
import { WebRevalidationService } from '@/modules/web-revalidation/web-revalidation.service';
import { WebUserNotificationsService } from '@/modules/web-user-notifications/web-user-notifications.service';
import {
  getCitySlug,
  getDistrictSlug,
  JobApprovalStatus,
  JobSource,
  JobStatus,
  RejectJobInput,
  UpdateJobInput,
  WebUserNotificationType,
} from '@careerslk/types';
import { Injectable } from '@nestjs/common';

interface JobFilters {
  company?: string;
  companyId?: number;
  status?: JobStatus;
  sector?: string;
  approvalStatus?: JobApprovalStatus;
  source?: JobSource;
}

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly webRevalidation: WebRevalidationService,
    private readonly webUserNotifications: WebUserNotificationsService,
  ) {}

  async findAll(filters: JobFilters) {
    const where = {
      status: filters.status,
      companyId: filters.companyId,
      sector: filters.sector,
      approvalStatus: filters.approvalStatus,
      source: filters.source,
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
    const job = await this.prisma.$transaction(async (tx) => {
      const before = await tx.job.findFirstOrThrow({
        where: { id, deletedAt: null },
      });

      // Correcting a scraper misclassification: resync the display
      // `location` string and the SeoLocation FK from the picked district/city.
      let locationPatch: { location?: string; seoLocationId?: number } = {};
      if (dto.district) {
        const locationSlug = dto.city
          ? getCitySlug(dto.city)
          : getDistrictSlug(dto.district);
        const seoLocation = locationSlug
          ? await tx.seoLocation.findUnique({ where: { slug: locationSlug } })
          : null;
        locationPatch = {
          location: dto.city ? `${dto.city}, ${dto.district}` : dto.district,
          seoLocationId: seoLocation?.id,
        };
      }

      const job = await tx.job.update({
        where: { id },
        data: { ...dto, ...locationPatch },
      });

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

    void this.webRevalidation.revalidateTags(['pseo-jobs']);

    return job;
  }

  async softDelete(id: number, context: AuditContext) {
    const job = await this.prisma.$transaction(async (tx) => {
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

    void this.webRevalidation.revalidateTags(['pseo-jobs']);

    return job;
  }

  async approve(id: number, adminUserId: number, context: AuditContext) {
    const job = await this.prisma.$transaction(async (tx) => {
      const before = await tx.job.findFirstOrThrow({
        where: { id, deletedAt: null },
      });

      const job = await tx.job.update({
        where: { id },
        data: {
          approvalStatus: JobApprovalStatus.APPROVED,
          approvedByAdminId: adminUserId,
          approvedAt: new Date(),
          rejectionReason: null,
        },
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.JOB_APPROVED,
          entityType: 'job',
          entityId: job.id,
          oldValue: { approvalStatus: before.approvalStatus },
          newValue: { approvalStatus: job.approvalStatus },
        },
        tx,
      );

      return job;
    });

    void this.webRevalidation.revalidateTags(['pseo-jobs']);

    if (job.postedByWebUserId) {
      void this.webUserNotifications.create(
        job.postedByWebUserId,
        WebUserNotificationType.JOB_APPROVED,
        'Job approved',
        `"${job.title}" is now live.`,
      );
    }

    return job;
  }

  async reject(id: number, dto: RejectJobInput, context: AuditContext) {
    const job = await this.prisma.$transaction(async (tx) => {
      const before = await tx.job.findFirstOrThrow({
        where: { id, deletedAt: null },
      });

      const job = await tx.job.update({
        where: { id },
        data: {
          approvalStatus: JobApprovalStatus.REJECTED,
          rejectionReason: dto.reason,
          approvedByAdminId: null,
          approvedAt: null,
        },
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.JOB_REJECTED,
          entityType: 'job',
          entityId: job.id,
          oldValue: { approvalStatus: before.approvalStatus },
          newValue: { approvalStatus: job.approvalStatus, reason: dto.reason },
        },
        tx,
      );

      return job;
    });

    void this.webRevalidation.revalidateTags(['pseo-jobs']);

    if (job.postedByWebUserId) {
      void this.webUserNotifications.create(
        job.postedByWebUserId,
        WebUserNotificationType.JOB_REJECTED,
        'Job rejected',
        `"${job.title}" was not approved: ${dto.reason}`,
      );
    }

    return job;
  }
}
