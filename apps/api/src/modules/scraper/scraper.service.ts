import { PrismaService } from '@/database/prisma.service';
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
    @InjectQueue(SCRAPER_JOB_QUEUE) private readonly jobQueue: Queue,
    @InjectQueue(SCRAPER_COMPANY_QUEUE) private readonly companyQueue: Queue,
  ) {}

  async scrapeOne(id: number, type: ScrapeType) {
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
  }

  async scrapeMany(ids: number[], type: ScrapeType) {
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
  }
}
