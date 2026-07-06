import {
  Company,
  ScrapeLogStatus,
  ScrapeLogTrigger,
  ScrapeStatus,
} from '@careerslk/database';
import { Browser, chromium } from 'playwright';
import { AIProvider, ScrapeType } from '../utils/enum';
import { PaginationType } from '@careerslk/types';
import { prisma } from '../utils/prisma';
import { ClaudeService } from './claude.service';
import { DeepSeekService } from './deepseek.service';
import { HashService } from './hash.service';
import { fetchPage } from './playwright.service';

const BROWSER_CONCURRENCY = 5;

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<unknown>,
): Promise<void> {
  const executing = new Set<Promise<unknown>>();
  for (const item of items) {
    const p = fn(item).finally(() => executing.delete(p));
    executing.add(p);
    if (executing.size >= limit) await Promise.race(executing);
  }
  await Promise.all(executing);
}

export interface ClaudeBatchContent {
  careerUrl: string;
  html: string;
  htmlSelector: string | null;
  companyId: number;
  scrapeLogId: number;
}

export class ScrapeService {
  // Scrape company info OR jobs — supports a single company or a bulk list.
  static async scrape(
    contents: Company | Company[],
    type: ScrapeType,
    trigger: ScrapeLogTrigger = ScrapeLogTrigger.MANUAL,
  ) {
    const browser = await chromium.launch({ channel: 'chromium' });

    try {
      if (Array.isArray(contents)) {
        await this.dispatchBulk(contents, browser, type, trigger);
      } else {
        await this.dispatchSingle(contents, browser, type, trigger);
      }
    } catch (err) {
      console.error(err);
    } finally {
      await browser.close();
    }
  }

  // Single company only: discover the company info & container selector first,
  // then scrape that company's jobs using the freshly-detected selector.
  static async scrapeCompanyThenJobs(
    company: Company,
    trigger: ScrapeLogTrigger = ScrapeLogTrigger.MANUAL,
  ) {
    const browser = await chromium.launch({ channel: 'chromium' });

    try {
      await this.dispatchSingle(company, browser, ScrapeType.COMPANY, trigger);

      const refreshed = await prisma.company.findUniqueOrThrow({
        where: { id: company.id },
      });
      await this.dispatchSingle(refreshed, browser, ScrapeType.JOBS, trigger);
    } catch (err) {
      console.error(err);
    } finally {
      await browser.close();
    }
  }

  // Pick the AI provider for the given scrape type from the environment.
  private static resolveProvider(type: ScrapeType): AIProvider {
    const setting =
      type === ScrapeType.JOBS
        ? process.env.JOBS_SCRAPPER
        : process.env.COMPANY_SCRAPPER;

    return setting === AIProvider.DEEPSEEK
      ? AIProvider.DEEPSEEK
      : AIProvider.CLAUDE;
  }

  private static async dispatchSingle(
    company: Company,
    browser: Browser,
    type: ScrapeType,
    trigger: ScrapeLogTrigger,
  ) {
    const html = await this.scrapeCompany(company, browser, type, trigger);
    if (!html) return;

    if (this.resolveProvider(type) === AIProvider.DEEPSEEK) {
      await DeepSeekService.singleCall(html, type);
    } else {
      await ClaudeService.singleCall(html, type);
    }
  }

  private static async dispatchBulk(
    companies: Company[],
    browser: Browser,
    type: ScrapeType,
    trigger: ScrapeLogTrigger,
  ) {
    const results: ClaudeBatchContent[] = [];

    await runWithConcurrency(
      companies,
      BROWSER_CONCURRENCY,
      async (company) => {
        const result = await this.scrapeCompany(
          company,
          browser,
          type,
          trigger,
        );
        if (result) results.push(result);
      },
    );

    if (results.length === 0) return;

    if (this.resolveProvider(type) === AIProvider.DEEPSEEK) {
      await DeepSeekService.batchCall(results, type);
    } else {
      await ClaudeService.batchCall(results, type);
    }
  }

  static async scrapeCompany(
    company: Company,
    browser: Browser,
    type: ScrapeType,
    trigger: ScrapeLogTrigger = ScrapeLogTrigger.MANUAL,
  ) {
    const startedAt = Date.now();
    let scrapeLogId: number | undefined;

    try {
      const [scrapeLog] = await prisma.$transaction([
        prisma.scrapeLog.create({
          data: {
            companyId: company.id,
            triggeredBy: trigger,
            status: ScrapeLogStatus.EMPTY,
            durationMs: Date.now() - startedAt,
            type: type,
          },
        }),
        prisma.company.update({
          where: { id: company.id },
          data: {
            scrapeStatus: ScrapeStatus.ACTIVE,
            lastScrapedAt: new Date(),
          },
        }),
      ]);
      scrapeLogId = scrapeLog.id;

      const pageHtml = await fetchPage(
        company.careerUrl,
        browser,
        company.paginationType as PaginationType,
        company.paginationBtn,
        company.htmlSelector,
      );

      const strippedHtml = HashService.strip(pageHtml, type);

      if (strippedHtml.length > 25000) {
        await prisma.scrapeLog.update({
          where: { id: scrapeLogId },
          data: {
            status: ScrapeLogStatus.SUSPECTED_FAILURE,
            htmlLength: strippedHtml.length,
            durationMs: Date.now() - startedAt,
            errorMessage: 'STRIPPED HTML EXCEEDED 25000 CHARACTERS',
            company: { update: { scrapeStatus: ScrapeStatus.CHECK } },
          },
        });
        return null;
      }

      if (
        type == ScrapeType.JOBS &&
        company.pageHash &&
        HashService.compareHash(strippedHtml, company.pageHash)
      ) {
        await prisma.scrapeLog.update({
          where: { id: scrapeLogId },
          data: {
            status: ScrapeLogStatus.SUCCESS,
            htmlLength: strippedHtml.length,
            durationMs: Date.now() - startedAt,
            errorMessage: 'SKIPPED DUE TO SAME HASH',
            company: { update: { scrapeStatus: ScrapeStatus.SKIPPED } },
          },
        });
        return null;
      }

      return {
        careerUrl: company.careerUrl,
        html: strippedHtml,
        htmlSelector: company.htmlSelector,
        companyId: company.id,
        scrapeLogId,
      };
    } catch (err) {
      if (err instanceof Error && scrapeLogId) {
        await prisma.scrapeLog.update({
          where: { id: scrapeLogId },
          data: {
            status: ScrapeLogStatus.ERROR,
            durationMs: Date.now() - startedAt,
            errorMessage: err.message,
            company: { update: { scrapeStatus: ScrapeStatus.ERROR } },
          },
        });
      }
      console.error(`Failed to scrape ${company.careerUrl}:`, err);
      return null;
    }
  }
}
