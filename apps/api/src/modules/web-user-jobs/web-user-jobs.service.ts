import { randomUUID } from 'node:crypto';
import { PrismaService } from '@/database/prisma.service';
import { StorageService } from '@/shared/storage/storage.service';
import { WebRevalidationService } from '@/modules/web-revalidation/web-revalidation.service';
import { slugify } from '@careerslk/lib/slugify';
import {
  CreateWebUserJobInput,
  getCitySlug,
  getDistrictSlug,
  JobApprovalStatus,
  JobSource,
  UpdateWebUserJobInput,
} from '@careerslk/types';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

// district/city -> the matching (city- or district-level) slug to resolve a
// SeoLocation row — same derivation the scraper does from an AI-classified
// city (see apps/scrapper/src/services/job.service.ts).
function locationSlugFor(district: string, city?: string): string | null {
  return city ? getCitySlug(city) : getDistrictSlug(district);
}

@Injectable()
export class WebUserJobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly webRevalidation: WebRevalidationService,
  ) {}

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

    const job = await this.prisma.$transaction(async (tx) => {
      const fingerprint = `web:${randomUUID()}`;
      const location = dto.city ? `${dto.city}, ${dto.district}` : dto.district;
      const locationSlug = locationSlugFor(dto.district, dto.city);
      const seoLocation = locationSlug
        ? await tx.seoLocation.findUnique({ where: { slug: locationSlug } })
        : null;

      const created = await tx.job.create({
        data: {
          ...dto,
          companyId: company.id,
          fingerprint,
          // Real slug depends on the autoincrement id, patched in below —
          // same two-step pattern the scraper uses (see job.service.ts).
          slug: `pending-${fingerprint}`,
          location,
          seoLocationId: seoLocation?.id,
          lastSeenAt: new Date(),
          source: JobSource.POSTED,
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

    void this.webRevalidation.revalidateTags(['pseo-jobs']);

    return job;
  }

  async findMine(webUserId: number) {
    return this.prisma.job.findMany({
      where: { postedByWebUserId: webUserId, profileHiddenAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true, logoUrl: true } },
      },
    });
  }

  // Editing an already-approved job re-enters review (unless the company is
  // trusted) so a poster can't bait-and-switch content after approval.
  async update(webUserId: number, jobId: number, dto: UpdateWebUserJobInput) {
    const job = await this.prisma.$transaction(async (tx) => {
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

      // Only recomputed when the poster actually resubmitted a district
      // (the edit form always sends district+city together, never one
      // without the other).
      let locationPatch: { location?: string; seoLocationId?: number } = {};
      if (dto.district) {
        const locationSlug = locationSlugFor(dto.district, dto.city);
        const seoLocation = locationSlug
          ? await tx.seoLocation.findUnique({ where: { slug: locationSlug } })
          : null;
        locationPatch = {
          location: dto.city ? `${dto.city}, ${dto.district}` : dto.district,
          seoLocationId: seoLocation?.id,
        };
      }

      return tx.job.update({
        where: { id: jobId },
        data: {
          ...dto,
          ...locationPatch,
          ...(resetToPending && {
            approvalStatus: JobApprovalStatus.PENDING,
            approvedAt: null,
            approvedByAdminId: null,
          }),
          ...(reapprove && { approvedAt: new Date() }),
        },
      });
    });

    void this.webRevalidation.revalidateTags(['pseo-jobs']);

    return job;
  }

  async uploadImage(
    webUserId: number,
    jobId: number,
    file: Express.Multer.File,
  ) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, postedByWebUserId: webUserId, deletedAt: null },
    });
    if (!job) throw new NotFoundException('Job not found');

    const result = await this.storage.upload(file, 'job-images');

    return this.prisma.job.update({
      where: { id: jobId },
      data: { imageUrl: result.url },
    });
  }

  async withdraw(webUserId: number, jobId: number) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, postedByWebUserId: webUserId, deletedAt: null },
    });
    if (!job) throw new NotFoundException('Job not found');

    const withdrawn = await this.prisma.$transaction(async (tx) => {
      await tx.savedJob.deleteMany({ where: { jobId } });
      return tx.job.update({
        where: { id: jobId },
        data: { deletedAt: new Date() },
      });
    });

    void this.webRevalidation.revalidateTags(['pseo-jobs']);

    return withdrawn;
  }

  // Only for a job the poster has already withdrawn — permanently drops it
  // from their own "My job postings" list (soft-hidden, not deleted, so
  // audit logs/keywords/AI batch records tied to the job id stay intact).
  async removeFromProfile(webUserId: number, jobId: number) {
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        postedByWebUserId: webUserId,
        deletedAt: { not: null },
      },
    });
    if (!job) throw new NotFoundException('Job not found');

    return this.prisma.job.update({
      where: { id: jobId },
      data: { profileHiddenAt: new Date() },
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
