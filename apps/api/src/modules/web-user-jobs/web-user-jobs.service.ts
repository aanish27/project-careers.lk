import { randomUUID } from 'node:crypto';
import { PrismaService } from '@/database/prisma.service';
import { slugify } from '@careerslk/lib/slugify';
import {
  CreateWebUserJobInput,
  JobApprovalStatus,
  JobSource,
  UpdateWebUserJobInput,
} from '@careerslk/types';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class WebUserJobsService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(webUserId: number, dto: CreateWebUserJobInput) {
    const webUser = await this.prisma.webUser.findUniqueOrThrow({
      where: { id: webUserId },
    });
    if (!webUser.companyId) {
      throw new BadRequestException(
        'Link a company before posting a job — create one or claim an existing company first',
      );
    }

    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: webUser.companyId },
    });

    return await this.prisma.$transaction(async (tx) => {
      const fingerprint = `web:${randomUUID()}`;

      const created = await tx.job.create({
        data: {
          ...dto,
          companyId: company.id,
          fingerprint,
          // Real slug depends on the autoincrement id, patched in below —
          // same two-step pattern the scraper uses (see job.service.ts).
          slug: `pending-${fingerprint}`,
          lastSeenAt: new Date(),
          source: JobSource.USER_SUBMITTED,
          postedByWebUserId: webUserId,
          approvalStatus: company.autoApproveJobs
            ? JobApprovalStatus.APPROVED
            : JobApprovalStatus.PENDING,
          approvedAt: company.autoApproveJobs ? new Date() : undefined,
        },
      });

      return tx.job.update({
        where: { id: created.id },
        data: {
          slug: `${slugify(dto.title)}-${slugify(company.name)}-${created.id}`,
        },
      });
    });
  }

  async findMine(webUserId: number) {
    return this.prisma.job.findMany({
      where: { postedByWebUserId: webUserId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true, logoUrl: true } },
      },
    });
  }

  // Editing an already-approved job re-enters review (unless the company is
  // trusted) so a poster can't bait-and-switch content after approval.
  async update(webUserId: number, jobId: number, dto: UpdateWebUserJobInput) {
    return await this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findFirst({
        where: { id: jobId, postedByWebUserId: webUserId, deletedAt: null },
      });
      if (!job) throw new NotFoundException('Job not found');

      const company = await tx.company.findUniqueOrThrow({
        where: { id: job.companyId },
      });

      const wasApproved = job.approvalStatus === JobApprovalStatus.APPROVED;
      const reapprove = wasApproved && company.autoApproveJobs;
      const resetToPending = wasApproved && !company.autoApproveJobs;

      return tx.job.update({
        where: { id: jobId },
        data: {
          ...dto,
          ...(resetToPending && {
            approvalStatus: JobApprovalStatus.PENDING,
            approvedAt: null,
            approvedByAdminId: null,
          }),
          ...(reapprove && { approvedAt: new Date() }),
        },
      });
    });
  }

  async withdraw(webUserId: number, jobId: number) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, postedByWebUserId: webUserId, deletedAt: null },
    });
    if (!job) throw new NotFoundException('Job not found');

    return this.prisma.job.update({
      where: { id: jobId },
      data: { deletedAt: new Date() },
    });
  }

  async save(webUserId: number, jobId: number) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, deletedAt: null },
    });
    if (!job) throw new NotFoundException('Job not found');

    return this.prisma.savedJob.upsert({
      where: { webUserId_jobId: { webUserId, jobId } },
      update: {},
      create: { webUserId, jobId },
    });
  }

  async unsave(webUserId: number, jobId: number): Promise<void> {
    await this.prisma.savedJob.deleteMany({ where: { webUserId, jobId } });
  }

  async findSaved(webUserId: number) {
    return this.prisma.savedJob.findMany({
      where: { webUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          include: {
            company: {
              select: { id: true, name: true, logoUrl: true, slug: true },
            },
          },
        },
      },
    });
  }
}
