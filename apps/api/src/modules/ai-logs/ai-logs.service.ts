import { PrismaService } from '@/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { FilterAiLogsDto } from './dto/filter-ai-logs.dto';

@Injectable()
export class AiLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: FilterAiLogsDto) {
    return await this.prisma.aiLog.findMany({
      where: {
        companyId: filters.companyId,
        scrapeLogId: filters.scrapeLogId,
        status: filters.status,
        model: filters.model,
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
      include: { company: { select: { id: true, name: true } } },
    });
  }

  async findOne(id: string) {
    return await this.prisma.aiLog.findFirstOrThrow({
      where: { id, deletedAt: null },
      include: { company: { select: { id: true, name: true } } },
    });
  }
}
