import { PrismaService } from '@/database/prisma.service';
import { AUDIT_ACTIONS } from '@/modules/audit/audit.constant';
import { AuditContext, AuditService } from '@/modules/audit/audit.service';
import {
  FreelanceApprovalStatus,
  RejectFreelanceProfileInput,
} from '@careerslk/types';
import { Injectable } from '@nestjs/common';
import { FilterFreelanceProfilesDto } from './dto/filters.dto';

@Injectable()
export class FreelanceProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(filters: FilterFreelanceProfilesDto) {
    return this.prisma.freelanceProfile.findMany({
      where: {
        approvalStatus: filters.approvalStatus,
        category: filters.category,
        webUserId: filters.webUserId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        webUser: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.freelanceProfile.findFirstOrThrow({
      where: { id, deletedAt: null },
      include: {
        webUser: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async softDelete(id: number, context: AuditContext) {
    return await this.prisma.$transaction(async (tx) => {
      const profile = await tx.freelanceProfile.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.FREELANCE_PROFILE_DELETED,
          entityType: 'freelance_profile',
          entityId: profile.id,
        },
        tx,
      );

      return profile;
    });
  }

  async approve(id: number, adminUserId: number, context: AuditContext) {
    return await this.prisma.$transaction(async (tx) => {
      const before = await tx.freelanceProfile.findFirstOrThrow({
        where: { id, deletedAt: null },
      });

      const profile = await tx.freelanceProfile.update({
        where: { id },
        data: {
          approvalStatus: FreelanceApprovalStatus.APPROVED,
          approvedByAdminId: adminUserId,
          approvedAt: new Date(),
          rejectionReason: null,
          internalReviewNotes: null,
        },
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.FREELANCE_PROFILE_APPROVED,
          entityType: 'freelance_profile',
          entityId: profile.id,
          oldValue: { approvalStatus: before.approvalStatus },
          newValue: { approvalStatus: profile.approvalStatus },
        },
        tx,
      );

      return profile;
    });
  }

  async reject(
    id: number,
    dto: RejectFreelanceProfileInput,
    context: AuditContext,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const before = await tx.freelanceProfile.findFirstOrThrow({
        where: { id, deletedAt: null },
      });

      const profile = await tx.freelanceProfile.update({
        where: { id },
        data: {
          approvalStatus: FreelanceApprovalStatus.REJECTED,
          rejectionReason: dto.reason ?? null,
          internalReviewNotes: dto.internalNotes ?? null,
          approvedByAdminId: null,
          approvedAt: null,
        },
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.FREELANCE_PROFILE_REJECTED,
          entityType: 'freelance_profile',
          entityId: profile.id,
          oldValue: { approvalStatus: before.approvalStatus },
          newValue: {
            approvalStatus: profile.approvalStatus,
            reason: dto.reason,
          },
        },
        tx,
      );

      return profile;
    });
  }
}
