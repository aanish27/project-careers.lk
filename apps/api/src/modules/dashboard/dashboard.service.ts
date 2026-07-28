import {
  computeCostUsd,
  getProviderForModel,
} from '@/common/utils/ai-pricing.util';
import { PrismaService } from '@/database/prisma.service';
import { SCRAPER_COMPANY_QUEUE, SCRAPER_JOB_QUEUE } from '@careerslk/types';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(SCRAPER_COMPANY_QUEUE) private readonly companyQueue: Queue,
    @InjectQueue(SCRAPER_JOB_QUEUE) private readonly jobQueue: Queue,
  ) {}

  async getStats() {
    const [
      companiesByStatus,
      jobsByStatus,
      lastScrapeLog,
      companyQueueCounts,
      jobQueueCounts,
      llmCostThisMonth,
    ] = await Promise.all([
      this.prisma.company.groupBy({
        by: ['scrapeStatus'],
        _count: { _all: true },
      }),
      this.prisma.job.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.scrapeLog.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      this.companyQueue.getJobCounts('waiting', 'active', 'failed'),
      this.jobQueue.getJobCounts('waiting', 'active', 'failed'),
      this.getMonthlyLlmCost(),
    ]);

    return {
      companies: {
        byScrapeStatus: Object.fromEntries(
          companiesByStatus.map((row) => [row.scrapeStatus, row._count._all]),
        ),
      },
      jobs: {
        byStatus: Object.fromEntries(
          jobsByStatus.map((row) => [row.status, row._count._all]),
        ),
      },
      lastScrapeRunAt: lastScrapeLog?.createdAt ?? null,
      queues: {
        company: companyQueueCounts,
        jobs: jobQueueCounts,
      },
      llmCostThisMonth,
    };
  }

  private async getMonthlyLlmCost() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const usageByModel = await this.prisma.aiLog.groupBy({
      by: ['model'],
      where: { createdAt: { gte: startOfMonth }, model: { not: null } },
      _sum: { inputTokens: true, outputTokens: true },
    });

    let totalUsd = 0;
    const byModel = usageByModel.map((row) => {
      const model = row.model as string;
      const inputTokens = row._sum.inputTokens ?? 0;
      const outputTokens = row._sum.outputTokens ?? 0;
      const estimatedUsd = computeCostUsd(model, inputTokens, outputTokens);
      const provider = getProviderForModel(model);

      if (estimatedUsd !== null) totalUsd += estimatedUsd;

      return { model, provider, inputTokens, outputTokens, estimatedUsd };
    });

    const byProvider = Object.values(
      byModel.reduce<
        Record<
          string,
          {
            provider: string;
            totalUsd: number;
            inputTokens: number;
            outputTokens: number;
          }
        >
      >((acc, row) => {
        const existing = acc[row.provider] ?? {
          provider: row.provider,
          totalUsd: 0,
          inputTokens: 0,
          outputTokens: 0,
        };
        existing.totalUsd += row.estimatedUsd ?? 0;
        existing.inputTokens += row.inputTokens;
        existing.outputTokens += row.outputTokens;
        acc[row.provider] = existing;
        return acc;
      }, {}),
    ).map((row) => ({
      ...row,
      totalUsd: Math.round(row.totalUsd * 1e6) / 1e6,
    }));

    return {
      totalUsd: Math.round(totalUsd * 1e6) / 1e6,
      byModel,
      byProvider,
    };
  }
}
