import {
  ScrapeLogStatus,
  ScrapeLogTrigger,
  ScrapeStatus,
} from '@careerslk/database';
import { randomInt } from 'node:crypto';
import { Browser, chromium, devices } from 'playwright';
import { prisma } from '..';
import { AIProvider, PaginationType } from '../utils/enum';
import { ClaudeService } from './claude.service';
import { DeepSeeakService } from './deepseek.service';
import { HashService } from './hash.service';
import { fetchPage } from './playwright.service';

export interface ClaudeBatchContent {
  careerUrl: string;
  html: string;
  htmlSelector: string | null;
  companyId: string;
  scrapeLogId: string;
}

export class ScrapeService {
  static async scrape() {
    const browser = await chromium.launch({ channel: 'chromium' });

    try {
      const companies = await prisma.company.findMany();

      const results = await Promise.all(
        companies.map(async (company) => {
          const startedAt = Date.now();

          let scrapeLogId: string | undefined;
          try {
            const [scrapeLog] = await prisma.$transaction([
              prisma.scrapeLog.create({
                data: {
                  companyId: company.id,
                  triggeredBy: ScrapeLogTrigger.MANUAL,
                  status: ScrapeLogStatus.EMPTY,
                  durationMs: Date.now() - startedAt,
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
            const strippedHtml = HashService.strip(
              pageHtml,
              !company.htmlSelector,
            );

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

            await prisma.company.update({
              where: { id: company.id },
              data: { pageHash: HashService.hash(strippedHtml) },
            });

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
        }),
      );

      const companiesHtml = results.filter(Boolean) as NonNullable<
        (typeof results)[number]
      >[];

      if (process.env.AI_PROVIDER === AIProvider.DEEPSEEK) {
        await DeepSeeakService.batchCall(companiesHtml);
      } else {
        await ClaudeService.batchCall(companiesHtml);
      }
      // await fs.writeFile('./claudebatch.txt', claude.toString());
      // console.log(HashService.hash(strippedData), strippedData.length);
      // console.log(strippedData);
    } catch (err) {
      console.error(err);
    } finally {
      await browser.close();
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

  static async scrapeById() {
    // ScrapeById
  }
}
