import {
  computeCostUsd,
  getProviderForModel,
} from '@/common/utils/ai-pricing.util';
import { PrismaService } from '@/database/prisma.service';
import { ScrapeLogStatus, ScrapeLogTrigger } from '@careerslk/database';
import { Injectable } from '@nestjs/common';

interface ScrapeLogFilters {
  status?: ScrapeLogStatus;
  company?: string;
  companyId?: number;
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
      companyId: filters.companyId,
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
    const scrapeLog = await this.prisma.scrapeLog.findUniqueOrThrow({
      where: { id },
      include: { company: true, aiLogs: true },
    });

    let totalCostUsd = 0;
    let hasPricedRow = false;
    const aiLogs = scrapeLog.aiLogs.map((log) => {
      const costUsd = computeCostUsd(
        log.model,
        log.inputTokens,
        log.outputTokens,
      );
      if (costUsd !== null) {
        hasPricedRow = true;
        totalCostUsd += costUsd;
      }
      return { ...log, provider: getProviderForModel(log.model), costUsd };
    });

    return {
      ...scrapeLog,
      aiLogs,
      totalCostUsd: hasPricedRow ? Math.round(totalCostUsd * 1e6) / 1e6 : null,
    };
  }
}
