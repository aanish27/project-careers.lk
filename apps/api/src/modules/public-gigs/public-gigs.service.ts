import { PrismaService } from '@/database/prisma.service';
import { StorageService } from '@/shared/storage/storage.service';
import { FreelanceApprovalStatus } from '@careerslk/types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FilterPublicGigsDto } from './dto/filter-public-gigs.dto';

@Injectable()
export class PublicGigsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findAll(filters: FilterPublicGigsDto) {
    const gigs = await this.prisma.gig.findMany({
      where: {
        approvalStatus: FreelanceApprovalStatus.APPROVED,
        deletedAt: null,
        category: filters.category,
        skills: filters.skill ? { has: filters.skill } : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(gigs.map((g) => this.withFileUrls(g)));
  }

  async findBySlug(slug: string) {
    const gig = await this.prisma.gig.findFirst({
      where: {
        slug,
        approvalStatus: FreelanceApprovalStatus.APPROVED,
        deletedAt: null,
      },
    });
    if (!gig) throw new NotFoundException('Gig not found');

    return this.withFileUrls(gig);
  }

  async sitemapEntries() {
    return this.prisma.gig.findMany({
      where: {
        approvalStatus: FreelanceApprovalStatus.APPROVED,
        deletedAt: null,
      },
      select: { slug: true, updatedAt: true },
    });
  }

  private async withFileUrls<T extends { attachmentFileKeys: string[] }>(
    gig: T,
  ) {
    const attachmentUrls = await Promise.all(
      gig.attachmentFileKeys.map((key) => this.storage.getUrl(key)),
    );
    return { ...gig, attachmentUrls };
  }
}
