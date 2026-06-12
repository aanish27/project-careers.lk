import Anthropic from '@anthropic-ai/sdk';
import { ScrapeLogStatus, ScrapeStatus } from '@careerslk/database';
import { prisma } from '..';
import {
  PROMPT_1_SYSTEM,
  PROMPT_1_USER,
  PROMPT_2_SYSTEM,
  PROMPT_2_USER,
} from '../utils/SYSTEM_PROMPTS';

import { ClaudeParsedResult } from '../utils/types';
import { HashService } from './hash.service';
import { ClaudeBatchContent } from './scrape.service';

const anthropic = new Anthropic();

export class DeepSeeakService {
  static async singleCall(content: string, isFirstRun: boolean) {
    const msg = await anthropic.messages.create({
      model: 'deepseek-v4-pro',
      max_tokens: 10000,
      system: [
        {
          type: 'text',
          text: isFirstRun ? PROMPT_1_SYSTEM : PROMPT_2_SYSTEM,
        },
      ],
      messages: [
        {
          role: 'user',
          content: isFirstRun ? PROMPT_1_USER(content) : PROMPT_2_USER(content),
        },
      ],
    });
    return msg;
  }

  static async batchCall(companies: ClaudeBatchContent[]) {
    companies.forEach(
      async ({ companyId, scrapeLogId, html, htmlSelector }) => {
        try {
          const msg = await this.singleCall(html, !htmlSelector);
          console.log(companyId);

          let jobsCount = 0;

          const scrapeLog = await prisma.scrapeLog.findFirstOrThrow({
            where: { id: scrapeLogId },
          });

          for (const element of msg.content) {
            if (element.type === 'text') {
              let parsed: ClaudeParsedResult;
              try {
                parsed = JSON.parse(element.text);
              } catch (err) {
                console.error(
                  `Failed to parse Claude response for ${companyId}:`,
                  err,
                );
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
                          durationMs:
                            Date.now() - scrapeLog.createdAt.getTime(),
                          errorMessage:
                            err instanceof Error
                              ? `Invalid JSON: ${err.message}`
                              : 'Invalid JSON in Claude response',
                        },
                      },
                    },
                  },
                });
                continue;
              }

              const { company, container, jobs } = parsed;

              if (company || container) {
                await prisma.company.update({
                  where: { id: companyId },
                  data: {
                    logoUrl: company?.logo_url,
                    htmlSelector: container?.selector,
                    htmlSelectorReason: container?.reason,
                    htmlSelectorType: container?.type,
                    htmlSelectorConfidence: container?.confidence,
                  },
                });
              }

              if (jobs.length > 0) {
                for (const job of jobs) {
                  const fingerprint = HashService.hash(
                    `${companyId} + ${job.title} + ${job.location} + ${job.employment_type} + ${job.department} + ${job.work_mode} + ${job.role_category}`,
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
      },
    );
  }
}
