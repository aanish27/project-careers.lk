import Anthropic from '@anthropic-ai/sdk';
import { ScrapeLogStatus, ScrapeStatus } from '@careerslk/database';
import { prisma } from '..';
import {
  SYSTEM_PROMPT_COMPANY,
  SYSTEM_PROMPT_JOBS,
  USER_PROMPT_COMPANY,
  USER_PROMPT_JOBS,
} from '../utils/PROMPTS';

import { ScrapeType } from '../utils/enum';
import { AiCompanyParsed, AiJob } from '../utils/types';
import { HashService } from './hash.service';
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
    try {
      const msg = await this.callModel(html, type, careerUrl);
      console.log(companyId);
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

            if (jobs.length > 0) {
              for (const job of jobs) {
                const fingerprint = HashService.hash(
                  `${companyId} + ${job.title} + ${job.location} + ${job.employment_type} + ${job.department} + ${job.work_mode} + ${job.role_category} + ${job.apply_url}`,
                );

                await prisma.job.upsert({
                  where: { fingerprint: fingerprint },
                  update: { lastSeenAt: new Date() },
                  create: {
                    title: job.title,
                    applyUrl: job.apply_url,
                    description: job.description,
                    department: job.department,
                    roleCategory: job.role_category,
                    workMode: job.work_mode,
                    location: job.location,
                    employmentType: job.employment_type,
                    company: { connect: { id: companyId } },
                    lastSeenAt: new Date(),
                    fingerprint: fingerprint,
                    keywords: {
                      createMany: {
                        data: job.keywords.map((keyword) => ({ keyword })),
                      },
                    },
                  },
                });

                jobsCount++;
              }
            }
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
          claudeLogs: {
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
    companies.forEach(async (company) => await this.singleCall(company, type));
  }
}
