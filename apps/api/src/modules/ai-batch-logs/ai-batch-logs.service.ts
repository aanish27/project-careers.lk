import { PrismaService } from '@/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { FilterAiBatchLogsDto } from './dto/filter-ai-batch-logs.dto';

@Injectable()
export class AiBatchLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: FilterAiBatchLogsDto) {
    return await this.prisma.aiBatchLog.findMany({
      where: {
        status: filters.status,
        type: filters.type,
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
    });
  }

  async findOne(id: string) {
    return await this.prisma.aiBatchLog.findFirstOrThrow({
      where: { id, deletedAt: null },
      include: {
        aiLogs: true,
        jobs: { select: { id: true, title: true } },
        companies: { select: { id: true, name: true } },
      },
    });
  }
}
