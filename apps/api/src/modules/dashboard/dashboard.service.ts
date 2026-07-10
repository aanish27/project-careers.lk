import { PrismaService } from '@/database/prisma.service';
import { SCRAPER_COMPANY_QUEUE, SCRAPER_JOB_QUEUE } from '@careerslk/types';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

// USD per 1M tokens. Only the model actually in use by the scraper needs an entry;
// usage from unrecognized models is reported with a null cost instead of guessed.
const MODEL_PRICING_PER_MILLION_TOKENS: Record<
  string,
  { input: number; output: number }
> = {
  'claude-haiku-4-5': { input: 1.0, output: 5.0 },
};

function getModelPricing(model: string) {
  const key = Object.keys(MODEL_PRICING_PER_MILLION_TOKENS).find((prefix) =>
    model.startsWith(prefix),
  );
  return key ? MODEL_PRICING_PER_MILLION_TOKENS[key] : undefined;
}

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

    const usageByModel = await this.prisma.claudeLog.groupBy({
      by: ['model'],
      where: { createdAt: { gte: startOfMonth }, model: { not: null } },
      _sum: { inputTokens: true, outputTokens: true },
    });

    let totalUsd = 0;
    const byModel = usageByModel.map((row) => {
      const model = row.model as string;
      const inputTokens = row._sum.inputTokens ?? 0;
      const outputTokens = row._sum.outputTokens ?? 0;
      const pricing = getModelPricing(model);
      const estimatedUsd = pricing
        ? (inputTokens / 1_000_000) * pricing.input +
          (outputTokens / 1_000_000) * pricing.output
        : null;

      if (estimatedUsd !== null) totalUsd += estimatedUsd;

      return { model, inputTokens, outputTokens, estimatedUsd };
    });

    return { totalUsd: Math.round(totalUsd * 1e6) / 1e6, byModel };
  }
}
