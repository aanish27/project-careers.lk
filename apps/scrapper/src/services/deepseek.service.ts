import Anthropic from '@anthropic-ai/sdk';
import { ScrapeLogStatus, ScrapeStatus } from '@careerslk/database';
import { prisma } from '../utils/prisma';
import {
  SYSTEM_PROMPT_COMPANY,
  SYSTEM_PROMPT_JOBS,
  USER_PROMPT_COMPANY,
  USER_PROMPT_JOBS,
} from '../utils/PROMPTS';

import { ScrapeType } from '../utils/enum';
import { AiCompanyParsed, AiJob } from '../utils/types';
import { upsertJobs } from './job.service';
import { ClaudeBatchContent } from './scrape.service';

const anthropic = new Anthropic({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
});

export class DeepSeekService {
  static async callModel(content: string, type: ScrapeType, careerUrl: string) {
    const msg = await anthropic.messages.create({
      model: 'deepseek-v4-pro',
      max_tokens: 10000,
      // thinking: { type: 'disabled' },
      system: [
        {
          type: 'text',
          text:
            type == ScrapeType.COMPANY
              ? SYSTEM_PROMPT_COMPANY
              : SYSTEM_PROMPT_JOBS,
        },
      ],
      messages: [
        {
          role: 'user',
          content:
            type == ScrapeType.COMPANY
              ? USER_PROMPT_COMPANY(content)
              : USER_PROMPT_JOBS(content, careerUrl),
        },
      ],
    });

    return msg;
  }

  static async singleCall(
    { companyId, html, scrapeLogId, careerUrl }: ClaudeBatchContent,
    type: ScrapeType,
  ) {
    const startedAt = Date.now();
    try {
      const msg = await this.callModel(html, type, careerUrl);
      let jobsCount = 0;

      const scrapeLog = await prisma.scrapeLog.findFirstOrThrow({
        where: { id: scrapeLogId },
      });

      for (const element of msg.content) {
        if (element.type === 'text') {
          let parsed;

          try {
            parsed = JSON.parse(element.text);
          } catch (err) {
            console.error(`Failed to parse Ai response for ${companyId}:`, err);
            await prisma.company.update({
              where: { id: companyId },
              data: {
                scrapeStatus: ScrapeStatus.ERROR,
                scrapeLogs: {
                  update: {
                    where: { id: scrapeLog.id },
                    data: {
                      status: ScrapeLogStatus.ERROR,
                      jobsFound: jobsCount,
                      durationMs: Date.now() - scrapeLog.createdAt.getTime(),
                      errorMessage:
                        err instanceof Error
                          ? `Invalid JSON: ${err.message}`
                          : 'Invalid JSON in Ai response',
                    },
                  },
                },
              },
            });
            continue;
          }

          if (type == ScrapeType.COMPANY) {
            const { company, container }: AiCompanyParsed = parsed;

            await prisma.company.update({
              where: { id: companyId },
              data: {
                logoUrl: company?.logo_url,
                atsPlatform: company?.ats_platform,
                htmlSelector: container?.selector,
                htmlSelectorReason: container?.reason,
                htmlSelectorType: container?.type,
                htmlSelectorConfidence: container?.confidence,
                paginationBtn: container?.paginationButton,
                paginationType: container?.paginationType,
                paginationReason: container?.paginationReason,
              },
            });
          } else {
            const jobs: AiJob[] = parsed;
            jobsCount = await upsertJobs(companyId, jobs);
          }
        }
      }

      await prisma.company.update({
        where: { id: companyId },
        data: {
          scrapeStatus: ScrapeStatus.EMPTY,
          scrapeLogs: {
            update: {
              where: { id: scrapeLog.id },
              data: {
                status: ScrapeLogStatus.SUCCESS,
                jobsFound: jobsCount,
                durationMs: Date.now() - scrapeLog.createdAt.getTime(),
              },
            },
          },
          aiLogs: {
            create: {
              id: msg.id,
              status: 'succeeded',
              scrapeLogId: scrapeLog.id,
              stopReason: msg.stop_reason,
              inputTokens: msg.usage.input_tokens,
              outputTokens: msg.usage.output_tokens,
              model: msg.model,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        await prisma.company.update({
          where: { id: companyId },
          data: {
            scrapeStatus: ScrapeStatus.ERROR,
            scrapeLogs: {
              update: {
                where: { id: scrapeLogId },
                data: {
                  status: ScrapeLogStatus.ERROR,
                  durationMs: Date.now() - startedAt,
                  errorMessage: error.message,
                },
              },
            },
          },
        });
      }
    }
  }

  static async batchCall(companies: ClaudeBatchContent[], type: ScrapeType) {
    await Promise.all(
      companies.map((company) => this.singleCall(company, type)),
    );
  }
}
