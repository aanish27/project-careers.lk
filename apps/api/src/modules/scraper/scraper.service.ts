import { PrismaService } from '@/database/prisma.service';
import { AUDIT_ACTIONS } from '@/modules/audit/audit.constant';
import { AuditContext, AuditService } from '@/modules/audit/audit.service';
import {
  SCRAPER_COMPANY_QUEUE,
  SCRAPER_JOB_QUEUE,
  ScrapeType,
} from '@careerslk/types';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class ScraperService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @InjectQueue(SCRAPER_JOB_QUEUE) private readonly jobQueue: Queue,
    @InjectQueue(SCRAPER_COMPANY_QUEUE) private readonly companyQueue: Queue,
  ) {}

  private auditAction(type: ScrapeType) {
    return type === ScrapeType.COMPANY
      ? AUDIT_ACTIONS.SCRAPE_COMPANY_TRIGGERED
      : AUDIT_ACTIONS.SCRAPE_JOBS_TRIGGERED;
  }

  async scrapeOne(id: number, type: ScrapeType, context: AuditContext) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: id },
    });

    if (type == ScrapeType.COMPANY) {
      await this.companyQueue.add(
        `scrape-${ScrapeType.COMPANY}-${company.name}`,
        {
          companyId: company.id,
        },
      );
    } else {
      await this.jobQueue.add(`scrape-${ScrapeType.JOBS}-${company.name}`, {
        companyId: company.id,
      });
    }

    await this.audit.record(context, {
      action: this.auditAction(type),
      entityType: 'company',
      entityId: company.id,
      newValue: { companyIds: [company.id] },
    });
  }

  async scrapeMany(ids: number[], type: ScrapeType, context: AuditContext) {
    const companies = await this.prisma.company.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const companyIds = companies.map((c) => c.id);

    if (type == ScrapeType.COMPANY) {
      await this.companyQueue.add(`scrape-${ScrapeType.COMPANY}-batch`, {
        companyId: companyIds,
      });
    } else {
      await this.jobQueue.add(`scrape-${ScrapeType.JOBS}-batch`, {
        companyId: companyIds,
      });
    }

    await this.audit.record(context, {
      action: this.auditAction(type),
      entityType: 'company',
      entityId: companyIds.join(','),
      newValue: { companyIds },
    });
  }
}
