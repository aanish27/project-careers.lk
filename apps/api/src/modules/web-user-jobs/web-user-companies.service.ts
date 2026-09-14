import { PrismaService } from '@/database/prisma.service';
import { StorageService } from '@/shared/storage/storage.service';
import { generateUniqueSlug } from '@careerslk/database';
import { assertNotSsrf, SsrfValidationError } from '@careerslk/lib/ssrf';
import { slugify } from '@careerslk/lib/slugify';
import {
  ClaimStatus,
  CompanyAutoApprovalStatus,
  CompanyStatus,
  CreateWebUserCompanyInput,
  UpdateWebUserCompanyInput,
} from '@careerslk/types';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class WebUserCompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private async assertUrlsNotSsrf(...urls: (string | undefined)[]) {
    try {
      await Promise.all(
        urls.filter((url): url is string => !!url).map(assertNotSsrf),
      );
    } catch (error) {
      if (error instanceof SsrfValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private hostnameOf(url: string | null): string {
    if (!url) return '';
    try {
      return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      return '';
    }
  }

  async create(webUserId: number, dto: CreateWebUserCompanyInput) {
    const webUser = await this.prisma.webUser.findUniqueOrThrow({
      where: { id: webUserId },
    });
    if (webUser.companyId) {
      throw new ConflictException('You already have a linked company');
    }

    await this.assertUrlsNotSsrf(
      dto.websiteUrl,
      dto.careerUrl,
      dto.logoUrl,
      dto.linkedinUrl,
      dto.twitterUrl,
      dto.facebookUrl,
      dto.instagramUrl,
    );

    return await this.prisma.$transaction(async (tx) => {
      const slug = await generateUniqueSlug(slugify(dto.name), (candidate) =>
        tx.company
          .findUnique({ where: { slug: candidate } })
          .then((existing) => existing !== null),
      );

      const company = await tx.company.create({
        data: {
          ...dto,
          slug,
          status: CompanyStatus.ACTIVE,
          createdByWebUserId: webUserId,
        },
      });

      await tx.webUser.update({
        where: { id: webUserId },
        data: { companyId: company.id },
      });

      return company;
    });
  }

  async search(q: string) {
    if (!q.trim()) return [];
    return this.prisma.company.findMany({
      where: { name: { contains: q, mode: 'insensitive' }, deletedAt: null },
      take: 10,
      select: { id: true, name: true, websiteUrl: true, logoUrl: true },
    });
  }

  // Same-domain claims link instantly; anything else queues for admin review
  // (see CompanyClaim) — otherwise anyone could claim "Google" and post
  // fake jobs or rewrite its details.
  async claim(webUserId: number, companyId: number) {
    const webUser = await this.prisma.webUser.findUniqueOrThrow({
      where: { id: webUserId },
    });
    if (webUser.companyId) {
      throw new ConflictException('You already have a linked company');
    }

    const company = await this.prisma.company.findFirstOrThrow({
      where: { id: companyId, deletedAt: null },
    });

    const companyDomain = this.hostnameOf(company.websiteUrl);
    const emailDomain = webUser.email.split('@')[1]?.toLowerCase() ?? '';

    if (companyDomain && emailDomain && companyDomain === emailDomain) {
      await this.prisma.webUser.update({
        where: { id: webUserId },
        data: { companyId: company.id },
      });
      return { status: ClaimStatus.APPROVED, companyId: company.id };
    }

    const claim = await this.prisma.companyClaim.upsert({
      where: { webUserId_companyId: { webUserId, companyId } },
      update: {
        status: ClaimStatus.PENDING,
        reviewedAt: null,
        reviewedByAdminId: null,
      },
      create: { webUserId, companyId, status: ClaimStatus.PENDING },
    });

    return { status: claim.status, claimId: claim.id };
  }

  async getMine(webUserId: number) {
    const webUser = await this.prisma.webUser.findUniqueOrThrow({
      where: { id: webUserId },
    });
    if (!webUser.companyId) return null;

    const company = await this.prisma.company.findUnique({
      where: { id: webUser.companyId },
    });
    if (!company) return null;

    const { brImageKey, ...rest } = company;
    return {
      ...rest,
      brImageUrl: brImageKey ? await this.storage.getUrl(brImageKey) : null,
    };
  }

  private async requireOwnCompanyId(webUserId: number): Promise<number> {
    const webUser = await this.prisma.webUser.findUniqueOrThrow({
      where: { id: webUserId },
    });
    if (!webUser.companyId) {
      throw new ForbiddenException('No linked company');
    }
    return webUser.companyId;
  }

  async updateMine(webUserId: number, dto: UpdateWebUserCompanyInput) {
    const companyId = await this.requireOwnCompanyId(webUserId);

    await this.assertUrlsNotSsrf(
      dto.websiteUrl,
      dto.careerUrl,
      dto.logoUrl,
      dto.linkedinUrl,
      dto.twitterUrl,
      dto.facebookUrl,
      dto.instagramUrl,
    );

    return this.prisma.company.update({
      where: { id: companyId },
      data: { ...dto },
    });
  }

  async uploadLogo(webUserId: number, file: Express.Multer.File) {
    const companyId = await this.requireOwnCompanyId(webUserId);

    const result = await this.storage.upload(file, 'company-logos');

    return this.prisma.company.update({
      where: { id: companyId },
      data: { logoUrl: this.storage.getPublicUrl(result.key) },
    });
  }

  async uploadBrImage(webUserId: number, file: Express.Multer.File) {
    const companyId = await this.requireOwnCompanyId(webUserId);

    const result = await this.storage.upload(file, 'company-br-images');

    const { brImageKey, ...company } = await this.prisma.company.update({
      where: { id: companyId },
      data: { brImageKey: result.key },
    });

    return {
      ...company,
      brImageUrl: await this.storage.getUrl(brImageKey!),
    };
  }

  async requestAutoApproval(webUserId: number) {
    const companyId = await this.requireOwnCompanyId(webUserId);

    return this.prisma.company.update({
      where: { id: companyId },
      data: {
        autoApprovalStatus: CompanyAutoApprovalStatus.REQUESTED,
        autoApprovalRequestedAt: new Date(),
      },
    });
  }
}
