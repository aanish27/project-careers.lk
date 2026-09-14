import { PrismaService } from '@/database/prisma.service';
import type { Prisma } from '@careerslk/database';
import { WebUserNotificationType } from '@careerslk/types';
import { Injectable, NotFoundException } from '@nestjs/common';

const DEFAULT_LIMIT = 20;

@Injectable()
export class WebUserNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(webUserId: number, limit: number = DEFAULT_LIMIT) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.webUserNotification.findMany({
        where: { webUserId },
        orderBy: [
          { readAt: { sort: 'asc', nulls: 'first' } },
          { createdAt: 'desc' },
        ],
        take: limit,
      }),
      this.prisma.webUserNotification.count({
        where: { webUserId, readAt: null },
      }),
    ]);

    return { items, unreadCount };
  }

  async markRead(webUserId: number, id: number) {
    const notification = await this.prisma.webUserNotification.findFirst({
      where: { id, webUserId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.webUserNotification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(webUserId: number) {
    await this.prisma.webUserNotification.updateMany({
      where: { webUserId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async create(
    webUserId: number,
    type: WebUserNotificationType,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.webUserNotification.create({
      data: {
        webUserId,
        type,
        title,
        message,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
