import { PrismaService } from '@/database/prisma.service';
import { StorageService } from '@/shared/storage/storage.service';
import { generateUniqueSlug } from '@careerslk/database';
import { slugify } from '@careerslk/lib/slugify';
import {
  CreateFreelanceProfileInput,
  FreelanceApprovalStatus,
  UpdateFreelanceProfileInput,
} from '@careerslk/types';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

const MAX_PORTFOLIO_FILES = 5;

@Injectable()
export class WebUserFreelanceProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private async requireOwnProfile(webUserId: number) {
    const profile = await this.prisma.freelanceProfile.findFirst({
      where: { webUserId, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundException('Freelance profile not found');
    }
    return profile;
  }

  async create(webUserId: number, dto: CreateFreelanceProfileInput) {
    const existing = await this.prisma.freelanceProfile.findFirst({
      where: { webUserId, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('You already have a freelance profile');
    }

    const webUser = await this.prisma.webUser.findUniqueOrThrow({
      where: { id: webUserId },
    });

    const base = slugify(
      [webUser.firstName, webUser.lastName].filter(Boolean).join(' ') ||
        webUser.email.split('@')[0],
    );

    const slug = await generateUniqueSlug(base, (candidate) =>
      this.prisma.freelanceProfile
        .findUnique({ where: { slug: candidate } })
        .then((existing) => existing !== null),
    );

    return this.prisma.freelanceProfile.create({
      data: {
        ...dto,
        webUserId,
        slug,
        approvalStatus: FreelanceApprovalStatus.PENDING,
      },
    });
  }

  async getMine(webUserId: number) {
    return this.prisma.freelanceProfile.findFirst({
      where: { webUserId, deletedAt: null },
    });
  }

  // Editing an approved profile takes it offline immediately and re-enters
  // the pending queue — no "stay live until re-approved" grace period.
  async updateMine(webUserId: number, dto: UpdateFreelanceProfileInput) {
    const profile = await this.requireOwnProfile(webUserId);
    const wasApproved =
      profile.approvalStatus === FreelanceApprovalStatus.APPROVED;

    return this.prisma.freelanceProfile.update({
      where: { id: profile.id },
      data: {
        ...dto,
        ...(wasApproved && {
          approvalStatus: FreelanceApprovalStatus.PENDING,
          approvedAt: null,
          approvedByAdminId: null,
        }),
      },
    });
  }

  async withdraw(webUserId: number) {
    const profile = await this.requireOwnProfile(webUserId);
    return this.prisma.freelanceProfile.update({
      where: { id: profile.id },
      data: { deletedAt: new Date() },
    });
  }

  async uploadCv(webUserId: number, file: Express.Multer.File) {
    const profile = await this.requireOwnProfile(webUserId);
    const result = await this.storage.upload(file, 'freelance-cvs');

    return this.prisma.freelanceProfile.update({
      where: { id: profile.id },
      data: { cvFileKey: result.key },
    });
  }

  async uploadPortfolioFiles(webUserId: number, files: Express.Multer.File[]) {
    const profile = await this.requireOwnProfile(webUserId);

    if (profile.portfolioFileKeys.length + files.length > MAX_PORTFOLIO_FILES) {
      throw new BadRequestException(
        `A freelance profile can have at most ${MAX_PORTFOLIO_FILES} portfolio files`,
      );
    }

    const uploaded = await Promise.all(
      files.map((file) => this.storage.upload(file, 'freelance-portfolio')),
    );

    return this.prisma.freelanceProfile.update({
      where: { id: profile.id },
      data: {
        portfolioFileKeys: [
          ...profile.portfolioFileKeys,
          ...uploaded.map((u) => u.key),
        ],
      },
    });
  }
}
