import { PrismaService } from '@/database/prisma.service';
import { Injectable } from '@nestjs/common';

const DEFAULT_LIMIT = 50;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(limit: number = DEFAULT_LIMIT) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { deletedAt: null },
        orderBy: [
          { readAt: { sort: 'asc', nulls: 'first' } },
          { createdAt: 'desc' },
        ],
        take: limit,
      }),
      this.prisma.notification.count({
        where: { deletedAt: null, readAt: null },
      }),
    ]);

    return { items, unreadCount };
  }

  async markRead(id: number) {
    return await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllRead() {
    await this.prisma.notification.updateMany({
      where: { readAt: null, deletedAt: null },
      data: { readAt: new Date() },
    });
  }
}
