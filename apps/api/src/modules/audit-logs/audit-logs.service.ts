import { PrismaService } from '@/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { FilterAuditLogsDto } from './dto/filter-audit-logs.dto';

const withActor = {
  actor: {
    select: { id: true, email: true, firstName: true, lastName: true },
  },
} as const;

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: FilterAuditLogsDto) {
    return await this.prisma.auditLog.findMany({
      where: {
        actorUserId: filters.actorUserId,
        entityType: filters.entityType,
        action: filters.action,
        entityId: filters.entityId,
        deletedAt: null,
        createdAt:
          filters.dateFrom || filters.dateTo
            ? {
                gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
                lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
              }
            : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: withActor,
    });
  }

  async findOne(id: number) {
    return await this.prisma.auditLog.findFirstOrThrow({
      where: { id, deletedAt: null },
      include: withActor,
    });
  }
}
