import { PrismaService } from '@/database/prisma.service';
import {
  SEO_DEACTIVATION_GRACE_DAYS,
  SEO_PAGE_THRESHOLDS,
  SEO_RETIREMENT_DAYS,
  SeoPageType,
} from '@careerslk/types';
import { Injectable, Logger } from '@nestjs/common';

export interface SeoLifecycleSummary {
  deactivated: number;
  reactivated: number;
  retired: number;
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * SRS 12.13 page deactivation lifecycle. Runs on its own weekly cron
 * (decision #7), independent of generation frequency. Uses a real elapsed-
 * time timestamp (firstBelowThresholdAt) rather than a run-count, since
 * generation can now run more than once a week (event-driven on scrape
 * completion) — a counter would deactivate pages after N *runs*, not N
 * *days*, defeating the grace period entirely.
 */
@Injectable()
export class SeoLifecycleService {
  private readonly logger = new Logger(SeoLifecycleService.name);

  constructor(private readonly prisma: PrismaService) {}

  async evaluateAll(): Promise<SeoLifecycleSummary> {
    const now = new Date();
    const graceThreshold = daysAgo(SEO_DEACTIVATION_GRACE_DAYS);
    const retirementThreshold = daysAgo(SEO_RETIREMENT_DAYS);

    // ALL_JOBS is always indexable by definition (decision #10) — exempt.
    const pages = await this.prisma.seoPage.findMany({
      where: { pageType: { not: SeoPageType.ALL_JOBS } },
    });

    const summary: SeoLifecycleSummary = {
      deactivated: 0,
      reactivated: 0,
      retired: 0,
    };

    for (const page of pages) {
      const threshold = SEO_PAGE_THRESHOLDS[page.pageType];
      const belowThreshold = page.jobCount < threshold;

      if (belowThreshold) {
        if (!page.firstBelowThresholdAt) {
          await this.prisma.seoPage.update({
            where: { id: page.id },
            data: { firstBelowThresholdAt: now },
          });
          continue;
        }

        if (page.firstBelowThresholdAt <= graceThreshold && page.isIndexable) {
          await this.prisma.seoPage.update({
            where: { id: page.id },
            data: { isIndexable: false, deactivatedAt: now },
          });
          summary.deactivated++;
        }

        if (
          page.deactivatedAt &&
          page.deactivatedAt <= retirementThreshold &&
          !page.retiredAt
        ) {
          await this.prisma.seoPage.update({
            where: { id: page.id },
            data: { retiredAt: now },
          });
          summary.retired++;
        }
        continue;
      }

      // Recovered above threshold.
      const needsReactivation =
        page.firstBelowThresholdAt !== null ||
        page.deactivatedAt !== null ||
        !page.isIndexable;

      if (needsReactivation) {
        await this.prisma.seoPage.update({
          where: { id: page.id },
          data: {
            firstBelowThresholdAt: null,
            deactivatedAt: null,
            retiredAt: null,
            // A page still failing QC (needsReview) stays noindex even
            // after clearing the threshold — the hard gate from decision #8
            // takes precedence over threshold recovery.
            isIndexable: !page.needsReview,
            lastmod: now,
          },
        });
        if (!page.isIndexable) summary.reactivated++;
      }
    }

    this.logger.log(`SEO lifecycle evaluation: ${JSON.stringify(summary)}`);
    return summary;
  }
}
