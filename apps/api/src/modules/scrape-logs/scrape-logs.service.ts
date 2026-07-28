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

  async findAll(filters: ScrapeLogFilters) {
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

    return await this.prisma.scrapeLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { company: { select: { id: true, name: true } } },
    });
  }

  async findOne(id: number) {
    return await this.prisma.scrapeLog.findUniqueOrThrow({
      where: { id },
      include: { company: true, aiLogs: true },
    });
  }
}
