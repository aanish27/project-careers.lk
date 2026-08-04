import { PrismaService } from '@/database/prisma.service';
import { StorageService } from '@/shared/storage/storage.service';
import { generateUniqueSlug } from '@careerslk/database';
import { slugify } from '@careerslk/lib/slugify';
import {
  CreateGigInput,
  FreelanceApprovalStatus,
  UpdateGigInput,
} from '@careerslk/types';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

const MAX_PENDING_GIGS_PER_USER = 5;
const MAX_GIG_ATTACHMENTS = 3;

@Injectable()
export class WebUserGigsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private async requireOwnGig(webUserId: number, gigId: number) {
    const gig = await this.prisma.gig.findFirst({
      where: { id: gigId, postedByWebUserId: webUserId, deletedAt: null },
    });
    if (!gig) throw new NotFoundException('Gig not found');
    return gig;
  }

  async submit(webUserId: number, dto: CreateGigInput) {
    const pendingCount = await this.prisma.gig.count({
      where: {
        postedByWebUserId: webUserId,
        approvalStatus: FreelanceApprovalStatus.PENDING,
      },
    });
    if (pendingCount >= MAX_PENDING_GIGS_PER_USER) {
      throw new BadRequestException(
        `You already have ${MAX_PENDING_GIGS_PER_USER} gigs awaiting approval — wait for those to be reviewed before submitting more`,
      );
    }

    const slug = await generateUniqueSlug(
      `${slugify(dto.title)}`,
      (candidate) =>
        this.prisma.gig
          .findUnique({ where: { slug: candidate } })
          .then((existing) => existing !== null),
    );

    return this.prisma.gig.create({
      data: {
        ...dto,
        postedByWebUserId: webUserId,
        slug,
        approvalStatus: FreelanceApprovalStatus.PENDING,
      },
    });
  }

  async findMine(webUserId: number) {
    return this.prisma.gig.findMany({
      where: { postedByWebUserId: webUserId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Same hard-offline-on-edit behavior as freelance profiles.
  async update(webUserId: number, gigId: number, dto: UpdateGigInput) {
    const gig = await this.requireOwnGig(webUserId, gigId);
    const wasApproved = gig.approvalStatus === FreelanceApprovalStatus.APPROVED;

    return this.prisma.gig.update({
      where: { id: gig.id },
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

  async withdraw(webUserId: number, gigId: number) {
    const gig = await this.requireOwnGig(webUserId, gigId);
    return this.prisma.gig.update({
      where: { id: gig.id },
      data: { deletedAt: new Date() },
    });
  }

  async uploadAttachments(
    webUserId: number,
    gigId: number,
    files: Express.Multer.File[],
  ) {
    const gig = await this.requireOwnGig(webUserId, gigId);

    if (gig.attachmentFileKeys.length + files.length > MAX_GIG_ATTACHMENTS) {
      throw new BadRequestException(
        `A gig can have at most ${MAX_GIG_ATTACHMENTS} attachments`,
      );
    }

    const uploaded = await Promise.all(
      files.map((file) => this.storage.upload(file, 'gig-attachments')),
    );

    return this.prisma.gig.update({
      where: { id: gig.id },
      data: {
        attachmentFileKeys: [
          ...gig.attachmentFileKeys,
          ...uploaded.map((u) => u.key),
        ],
      },
    });
  }
}
