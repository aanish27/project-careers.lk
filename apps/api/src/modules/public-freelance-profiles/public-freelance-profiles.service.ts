import { PrismaService } from '@/database/prisma.service';
import { StorageService } from '@/shared/storage/storage.service';
import { FreelanceApprovalStatus } from '@careerslk/types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FilterPublicFreelanceProfilesDto } from './dto/filter-public-freelance-profiles.dto';

@Injectable()
export class PublicFreelanceProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findAll(filters: FilterPublicFreelanceProfilesDto) {
    const profiles = await this.prisma.freelanceProfile.findMany({
      where: {
        approvalStatus: FreelanceApprovalStatus.APPROVED,
        deletedAt: null,
        category: filters.category,
        skills: filters.skill ? { has: filters.skill } : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(profiles.map((p) => this.withFileUrls(p)));
  }

  async findBySlug(slug: string) {
    const profile = await this.prisma.freelanceProfile.findFirst({
      where: {
        slug,
        approvalStatus: FreelanceApprovalStatus.APPROVED,
        deletedAt: null,
      },
    });
    if (!profile) throw new NotFoundException('Freelance profile not found');

    return this.withFileUrls(profile);
  }

  async sitemapEntries() {
    return this.prisma.freelanceProfile.findMany({
      where: {
        approvalStatus: FreelanceApprovalStatus.APPROVED,
        deletedAt: null,
      },
      select: { slug: true, updatedAt: true },
    });
  }

  // File keys are resolved to freshly-signed URLs on every read, never
  // persisted — the underlying presigned URL expires after 1h.
  private async withFileUrls<
    T extends { cvFileKey: string | null; portfolioFileKeys: string[] },
  >(profile: T) {
    const [cvUrl, portfolioUrls] = await Promise.all([
      profile.cvFileKey ? this.storage.getUrl(profile.cvFileKey) : null,
      Promise.all(
        profile.portfolioFileKeys.map((key) => this.storage.getUrl(key)),
      ),
    ]);

    return { ...profile, cvUrl, portfolioUrls };
  }
}
