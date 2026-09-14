import { randomUUID } from 'node:crypto';
import { PrismaService } from '@/database/prisma.service';
import { StorageService } from '@/shared/storage/storage.service';
import { WebRevalidationService } from '@/modules/web-revalidation/web-revalidation.service';
import { generateUniqueSlug } from '@careerslk/database';
import { assertNotSsrf, SsrfValidationError } from '@careerslk/lib/ssrf';
import { slugify } from '@careerslk/lib/slugify';
import {
  CompanyStatus,
  getCitySlug,
  getDistrictSlug,
  JobApprovalStatus,
  JobSource,
  PostJobRequestInput,
  UpdateWebUserJobInput,
} from '@careerslk/types';
import {
  BadRequestException,
  ConflictException,
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

  // Creates the company (when the poster doesn't have one yet) and the job
  // in a single transaction, so a failure in either leaves neither behind —
  // no orphaned company with no job. The optional image upload happens
  // after the transaction commits, as a best-effort step: it's external
  // storage I/O, not a database write, so it shouldn't hold the transaction
  // open, and a failed upload shouldn't undo an otherwise-valid posting.
  async submit(
    webUserId: number,
    dto: PostJobRequestInput,
    file?: Express.Multer.File,
  ) {
    const webUser = await this.prisma.webUser.findUniqueOrThrow({
      where: { id: webUserId },
    });

    if (!webUser.companyId && !dto.company) {
      throw new BadRequestException(
        'Link a company before posting a job — create one or claim an existing company first',
      );
    }
    if (webUser.companyId && dto.company) {
      throw new ConflictException('You already have a linked company');
    }
    if (dto.company?.websiteUrl) {
      try {
        await assertNotSsrf(dto.company.websiteUrl);
      } catch (error) {
        if (error instanceof SsrfValidationError) {
          throw new BadRequestException(error.message);
        }
        throw error;
      }
    }

    const { job, currentWebUser } = await this.prisma.$transaction(
      async (tx) => {
        let currentWebUser = webUser;

        if (dto.company) {
          const slug = await generateUniqueSlug(
            slugify(dto.company.name),
            (candidate) =>
              tx.company
                .findUnique({ where: { slug: candidate } })
                .then((existing) => existing !== null),
          );

          const newCompany = await tx.company.create({
            data: {
              name: dto.company.name,
              websiteUrl: dto.company.websiteUrl,
              slug,
              status: CompanyStatus.ACTIVE,
              createdByWebUserId: webUserId,
            },
          });

          currentWebUser = await tx.webUser.update({
            where: { id: webUserId },
            data: { companyId: newCompany.id },
          });
        }

        const company = await tx.company.findUniqueOrThrow({
          where: { id: currentWebUser.companyId! },
        });

        const jobDto = dto.job;
        const fingerprint = `web:${randomUUID()}`;
        const location = jobDto.city
          ? `${jobDto.city}, ${jobDto.district}`
          : jobDto.district;
        const locationSlug = jobDto.district
          ? locationSlugFor(jobDto.district, jobDto.city)
          : null;
        const seoLocation = locationSlug
          ? await tx.seoLocation.findUnique({ where: { slug: locationSlug } })
          : null;
        // Same resolution the scraper does from an AI-classified role
        // category (see apps/scrapper/src/services/job.service.ts) —
        // SeoRole rows are seeded 1:1 from the same role-category taxonomy
        // this form's "Role category" select draws from.
        const seoRole = jobDto.roleCategory
          ? await tx.seoRole.findUnique({
              where: { slug: slugify(jobDto.roleCategory) },
            })
          : null;

        const created = await tx.job.create({
          data: {
            ...jobDto,
            companyId: company.id,
            fingerprint,
            // Real slug depends on the autoincrement id, patched in below —
            // same two-step pattern the scraper uses (see job.service.ts).
            slug: `pending-${fingerprint}`,
            location,
            seoLocationId: seoLocation?.id,
            seoRoleId: seoRole?.id,
            lastSeenAt: new Date(),
            source: JobSource.POSTED,
            postedByWebUserId: webUserId,
            approvalStatus: company.autoApproveJobs
              ? JobApprovalStatus.APPROVED
              : JobApprovalStatus.PENDING,
            approvedAt: company.autoApproveJobs ? new Date() : undefined,
          },
        });

        const job = await tx.job.update({
          where: { id: created.id },
          data: {
            slug: `${slugify(jobDto.title)}-${slugify(company.name)}-${created.id}`,
          },
        });

        return { job, currentWebUser };
      },
    );

    void this.webRevalidation.revalidateTags(['pseo-jobs']);

    if (file) {
      await this.storage
        .upload(file, 'job-images')
        .then((result) =>
          this.prisma.job.update({
            where: { id: job.id },
            data: { imageUrl: result.url },
          }),
        )
        .catch(() => {});
    }

    return { job, webUser: currentWebUser };
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

      // Same idea as locationPatch above — only recomputed when the poster
      // actually resubmitted a role category.
      let rolePatch: { seoRoleId?: number } = {};
      if (dto.roleCategory) {
        const seoRole = await tx.seoRole.findUnique({
          where: { slug: slugify(dto.roleCategory) },
        });
        rolePatch = { seoRoleId: seoRole?.id };
      }

      return tx.job.update({
        where: { id: jobId },
        data: {
          ...dto,
          ...locationPatch,
          ...rolePatch,
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
      data: { imageUrl: this.storage.getPublicUrl(result.key) },
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

  // For a job the poster has already withdrawn, or one an admin rejected
  // outright — permanently drops it from their own "My job postings" list
  // (soft-hidden, not deleted, so audit logs/keywords/AI batch records tied
  // to the job id stay intact). A rejected job was never live, so it's
  // withdrawn in the same step rather than requiring the poster to withdraw
  // it first.
  async removeFromProfile(webUserId: number, jobId: number) {
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        postedByWebUserId: webUserId,
        OR: [
          { deletedAt: { not: null } },
          { approvalStatus: JobApprovalStatus.REJECTED },
        ],
      },
    });
    if (!job) throw new NotFoundException('Job not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.savedJob.deleteMany({ where: { jobId } });
      return tx.job.update({
        where: { id: jobId },
        data: {
          profileHiddenAt: new Date(),
          deletedAt: job.deletedAt ?? new Date(),
        },
      });
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

  async isSaved(webUserId: number, jobId: number): Promise<boolean> {
    const saved = await this.prisma.savedJob.findUnique({
      where: { webUserId_jobId: { webUserId, jobId } },
    });
    return saved !== null;
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
