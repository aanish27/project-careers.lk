import { PrismaService } from '@/database/prisma.service';
import { AUDIT_ACTIONS } from '@/modules/audit/audit.constant';
import { AuditContext, AuditService } from '@/modules/audit/audit.service';
import { FreelanceApprovalStatus, RejectGigInput } from '@careerslk/types';
import { Injectable } from '@nestjs/common';
import { FilterGigsDto } from './dto/filters.dto';

@Injectable()
export class GigsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(filters: FilterGigsDto) {
    return this.prisma.gig.findMany({
      where: {
        approvalStatus: filters.approvalStatus,
        category: filters.category,
        postedByWebUserId: filters.postedByWebUserId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        postedBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.gig.findFirstOrThrow({
      where: { id, deletedAt: null },
      include: {
        postedBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async softDelete(id: number, context: AuditContext) {
    return await this.prisma.$transaction(async (tx) => {
      const gig = await tx.gig.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.GIG_DELETED,
          entityType: 'gig',
          entityId: gig.id,
          oldValue: { title: gig.title },
        },
        tx,
      );

      return gig;
    });
  }

  async approve(id: number, adminUserId: number, context: AuditContext) {
    return await this.prisma.$transaction(async (tx) => {
      const before = await tx.gig.findFirstOrThrow({
        where: { id, deletedAt: null },
      });

      const gig = await tx.gig.update({
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
          action: AUDIT_ACTIONS.GIG_APPROVED,
          entityType: 'gig',
          entityId: gig.id,
          oldValue: { approvalStatus: before.approvalStatus },
          newValue: { approvalStatus: gig.approvalStatus },
        },
        tx,
      );

      return gig;
    });
  }

  async reject(id: number, dto: RejectGigInput, context: AuditContext) {
    return await this.prisma.$transaction(async (tx) => {
      const before = await tx.gig.findFirstOrThrow({
        where: { id, deletedAt: null },
      });

      const gig = await tx.gig.update({
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
          action: AUDIT_ACTIONS.GIG_REJECTED,
          entityType: 'gig',
          entityId: gig.id,
          oldValue: { approvalStatus: before.approvalStatus },
          newValue: {
            approvalStatus: gig.approvalStatus,
            reason: dto.reason,
          },
        },
        tx,
      );

      return gig;
    });
  }
}
