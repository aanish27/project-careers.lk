import { PrismaService } from '@/database/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class WebUserBlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async block(blockerId: number, blockedId: number) {
    if (blockerId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }

    return this.prisma.webUserBlock.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: {},
      create: { blockerId, blockedId },
    });
  }

  async unblock(blockerId: number, blockedId: number): Promise<void> {
    await this.prisma.webUserBlock.deleteMany({
      where: { blockerId, blockedId },
    });
  }

  async listBlocked(blockerId: number) {
    const blocks = await this.prisma.webUserBlock.findMany({
      where: { blockerId },
      orderBy: { createdAt: 'desc' },
      include: {
        blocked: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return blocks.map((b) => ({ ...b.blocked, blockedAt: b.createdAt }));
  }

  // Either party may have blocked the other — a block always makes the
  // thread read-only regardless of who initiated it.
  async isBlockedEitherDirection(aId: number, bId: number): Promise<boolean> {
    const count = await this.prisma.webUserBlock.count({
      where: {
        OR: [
          { blockerId: aId, blockedId: bId },
          { blockerId: bId, blockedId: aId },
        ],
      },
    });
    return count > 0;
  }
}
