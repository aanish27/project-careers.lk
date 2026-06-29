import {
  Company,
  ScrapeLogStatus,
  ScrapeLogTrigger,
  ScrapeStatus,
} from '@careerslk/database';
import { randomInt } from 'node:crypto';
import { Browser, chromium, devices } from 'playwright';
import { prisma } from '../utils/prisma';
import { AIProvider, PaginationType, ScrapeType } from '../utils/enum';
import { ClaudeService } from './claude.service';
import { DeepSeekService } from './deepseek.service';
import { HashService } from './hash.service';
import { fetchPage } from './playwright.service';

export interface ClaudeBatchContent {
  careerUrl: string;
  html: string;
  htmlSelector: string | null;
  companyId: number;
  scrapeLogId: number;
}

export class ScrapeService {
  // Scrape company info OR jobs — supports a single company or a bulk list.
  static async scrape(contents: Company | Company[], type: ScrapeType) {
    const browser = await chromium.launch({ channel: 'chromium' });

    try {
      if (Array.isArray(contents)) {
        await this.dispatchBulk(contents, browser, type);
      } else {
        await this.dispatchSingle(contents, browser, type);
      }
    } catch (err) {
      console.error(err);
    } finally {
      await browser.close();
    }
  }

  // Single company only: discover the company info & container selector first,
  // then scrape that company's jobs using the freshly-detected selector.
  static async scrapeCompanyThenJobs(company: Company) {
    const browser = await chromium.launch({ channel: 'chromium' });

    try {
      await this.dispatchSingle(company, browser, ScrapeType.COMPANY);

      const refreshed = await prisma.company.findUniqueOrThrow({
        where: { id: company.id },
      });
      await this.dispatchSingle(refreshed, browser, ScrapeType.JOBS);
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
  ) {
    const html = await this.scrapeCompany(company, browser, type);
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
  ) {
    const results = (
      await Promise.all(
        companies.map((company) => this.scrapeCompany(company, browser, type)),
      )
    ).filter(Boolean) as ClaudeBatchContent[];

    if (results.length === 0) return;

    if (this.resolveProvider(type) === AIProvider.DEEPSEEK) {
      await DeepSeekService.batchCall(results, type);
    } else {
      await ClaudeService.batchCall(results, type);
    }
  }

  static async scrapePage(url: string, browser: Browser) {
    // implement ssrf check
    // const data = await fs.readFile('./jhonkeel.txt', 'utf8');
    // const strippedData = await HashService.strip(data, true);

    const timeOut = randomInt(30000, 80000);
    const context = await browser.newContext(devices['iPhone 11']);
    const page = await context.newPage();

    await page.goto(url, {
      timeout: timeOut,
    });

    const element = await page.content();
    await context.close();

    return element;
    // try {
    //   await fs.writeFile('./ifs.txt', element);
    // } catch (err) {
    //   console.log(err);
    // }
  }

  static async scrapeCompany(
    company: Company,
    browser: Browser,
    type: ScrapeType,
  ) {
    {
      const startedAt = Date.now();

      let scrapeLogId: number | undefined;
      try {
        const [scrapeLog] = await prisma.$transaction([
          prisma.scrapeLog.create({
            data: {
              companyId: company.id,
              triggeredBy: ScrapeLogTrigger.MANUAL,
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

        if (type == ScrapeType.JOBS) {
          await prisma.company.update({
            where: { id: company.id },
            data: { pageHash: HashService.hash(strippedHtml) },
          });
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
}
