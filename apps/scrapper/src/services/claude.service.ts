import Anthropic from '@anthropic-ai/sdk';
import { Prisma, ScrapeLogStatus, ScrapeStatus } from '@careerslk/database';
import {
  BATCH_POLL_DELAY_MS,
  BATCH_POLL_MAX_ATTEMPTS,
  BatchPollJobData,
  SCRAPER_BATCH_POLL_QUEUE,
} from '@careerslk/types';
import { Queue } from 'bullmq';
import { prisma } from '../utils/prisma';

import { ClaudeBatchStatus, ScrapeType } from '../utils/enum';
import {
  CLAUDE_SCHEMA_COMPANY,
  CLAUDE_SCHEMA_JOBS,
} from '../utils/OUTPUT_SCHEMA';
import {
  SYSTEM_PROMPT_COMPANY,
  SYSTEM_PROMPT_JOBS,
  USER_PROMPT_COMPANY,
  USER_PROMPT_JOBS,
} from '../utils/PROMPTS';
import { AiCompanyParsed, AiJob } from '../utils/types';
import { connection } from '../utils/redis';
import { upsertJobs } from './job.service';
import { ClaudeBatchContent } from './scrape.service';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
  baseURL: process.env.CLAUDE_BASE_URL,
});

const batchPollQueue = new Queue<BatchPollJobData>(SCRAPER_BATCH_POLL_QUEUE, {
  connection,
  defaultJobOptions: { removeOnComplete: true, removeOnFail: 100 },
});

export class ClaudeService {
  static async callModel(content: string, type: ScrapeType, careerUrl: string) {
    return anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: [
        {
          type: 'text',
          text:
            type == ScrapeType.COMPANY
              ? SYSTEM_PROMPT_COMPANY
              : SYSTEM_PROMPT_JOBS,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content:
            type == ScrapeType.COMPANY
              ? USER_PROMPT_COMPANY(content, careerUrl)
              : USER_PROMPT_JOBS(content, careerUrl),
        },
      ],
      output_config:
        type == ScrapeType.COMPANY ? CLAUDE_SCHEMA_COMPANY : CLAUDE_SCHEMA_JOBS,
    });
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
                      durationMs: Date.now() - scrapeLog.createdAt.getTime(),
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
            const jobs: AiJob[] = parsed.jobs;
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

  static async batchCall(contents: ClaudeBatchContent[], type: ScrapeType) {
    try {
      const msg = await anthropic.messages.batches.create({
        requests: [
          ...contents.map((content) => ({
            custom_id: content.companyId.toString(),
            params: {
              model: 'claude-haiku-4-5-20251001',
              system: [
                {
                  type: 'text' as const,
                  text:
                    type == ScrapeType.COMPANY
                      ? SYSTEM_PROMPT_COMPANY
                      : SYSTEM_PROMPT_JOBS,
                  cache_control: { type: 'ephemeral' as const },
                },
              ],
              max_tokens: 4000,
              messages: [
                {
                  role: 'user' as const,
                  content:
                    type == ScrapeType.COMPANY
                      ? USER_PROMPT_COMPANY(content.html, content.careerUrl)
                      : USER_PROMPT_JOBS(content.html, content.careerUrl),
                },
              ],
              output_config:
                type == ScrapeType.COMPANY
                  ? CLAUDE_SCHEMA_COMPANY
                  : CLAUDE_SCHEMA_JOBS,
            },
          })),
        ],
      });

      await prisma.claudeBatchLog.create({
        data: {
          id: msg.id,
          status: msg.processing_status,
          type: type,
          response: msg as unknown as Prisma.InputJsonValue,
          companies: {
            connect: contents.map((content) => ({ id: content.companyId })),
          },
        },
      });

      await batchPollQueue.add(
        'poll',
        { batchId: msg.id, type },
        {
          delay: BATCH_POLL_DELAY_MS,
          attempts: BATCH_POLL_MAX_ATTEMPTS,
          backoff: { type: 'fixed', delay: BATCH_POLL_DELAY_MS },
        },
      );

      return msg;
    } catch (error) {
      console.error(error);
    }
  }

  static async processBatch(batchId: string, type: ScrapeType) {
    const messageBatch = await anthropic.messages.batches.retrieve(batchId);

    if (messageBatch.processing_status !== ClaudeBatchStatus.ENDED) {
      throw new Error(
        `Batch ${batchId} is still ${messageBatch.processing_status}`,
      );
    }

    await prisma.claudeBatchLog.update({
      where: { id: batchId },
      data: {
        status: messageBatch.processing_status,
        response: messageBatch as unknown as Prisma.InputJsonValue,
      },
    });

    resultsLoop: for await (const result of await anthropic.messages.batches.results(
      batchId,
    )) {
      let jobsCount = 0;
      const companyId = Number(result.custom_id);
      const scrapeLog = await prisma.scrapeLog.findFirstOrThrow({
        orderBy: { createdAt: 'desc' },
        where: { companyId: companyId },
      });

      switch (result.result.type) {
        case 'succeeded':
          console.log(`Success! ${JSON.stringify(result)}`);

          for (const element of result.result.message.content) {
            if (element.type === 'text') {
              let parsed;
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
                continue resultsLoop;
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
                const jobs: AiJob[] = parsed.jobs;
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
              claudeLogs: {
                create: {
                  id: result.result.message.id,
                  status: result.result.type,
                  scrapeLogId: scrapeLog.id,
                  stopReason: result.result.message?.stop_reason,
                  batchId: batchId,
                  inputTokens: result.result.message.usage.input_tokens,
                  outputTokens: result.result.message.usage.output_tokens,
                  model: result.result.message.model,
                },
              },
            },
          });
          break;
        case 'errored':
          // if (result.result.error.error.type === 'invalid_request_error') {};
          // Request body must be fixed before re-sending request
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
                    errorMessage: result.result.error.error.message,
                  },
                },
              },
              claudeLogs: {
                create: {
                  id: result.result.error.request_id!,
                  status: result.result.type,
                  scrapeLogId: scrapeLog.id,
                  stopReason: result.result.error.type,
                  batchId: batchId,
                },
              },
            },
          });
          break;

        // console.log(`Validation error: ${companyId}`);
        // } else {
        //   // Request can be retried directly
        //   console.log(`Server error: ${companyId}`);
        // }
        case 'expired':
          console.log(`Request expired: ${companyId}`);
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
                    errorMessage: result.result.type,
                  },
                },
              },
              claudeLogs: {
                create: {
                  id: result.custom_id,
                  status: result.result.type,
                  scrapeLogId: scrapeLog.id,
                  stopReason: result.result.type,
                  batchId: batchId,
                },
              },
            },
          });
          break;
      }
    }
  }
}
