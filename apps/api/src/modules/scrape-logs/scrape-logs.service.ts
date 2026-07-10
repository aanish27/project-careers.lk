import { PrismaService } from '@/database/prisma.service';
import { ScrapeLogStatus, ScrapeLogTrigger } from '@careerslk/database';
import { Injectable } from '@nestjs/common';

interface ScrapeLogFilters {
  status?: ScrapeLogStatus;
  company?: string;
  triggeredBy?: ScrapeLogTrigger;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class ScrapeLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: ScrapeLogFilters, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = {
      status: filters.status,
      triggeredBy: filters.triggeredBy,
      company: filters.company ? { name: filters.company } : undefined,
      createdAt:
        filters.dateFrom || filters.dateTo
          ? {
              gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
              lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
            }
          : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.scrapeLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { company: { select: { id: true, name: true } } },
      }),
      this.prisma.scrapeLog.count({ where }),
    ]);

    return { items, page, limit, total };
  }

  async findOne(id: number) {
    return await this.prisma.scrapeLog.findUniqueOrThrow({
      where: { id },
      include: { company: true, claudeLogs: true },
    });
  }
}
