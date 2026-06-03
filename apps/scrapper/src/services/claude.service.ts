import Anthropic from '@anthropic-ai/sdk';
import { Prisma, ScrapeLogStatus, ScrapeStatus } from '@careerslk/database';
import { prisma } from '..';
import { CONFIG_1, CONFIG_2 } from '../utils/OUTPUT_CONFIGS';
import {
  PROMPT_1_SYSTEM,
  PROMPT_1_USER,
  PROMPT_2_SYSTEM,
  PROMPT_2_USER,
} from '../utils/SYSTEM_PROMPTS';

import { ClaudeBatchStatus } from '../utils/enum';
import { ClaudeParsedResult } from '../utils/types';
import { HashService } from './hash.service';
import { ClaudeBatchContent } from './scrape.service';

const anthropic = new Anthropic();

export class ClaudeService {
  static async singleCall(content: string, isFirstRun: boolean) {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: [
        {
          type: 'text',
          text: isFirstRun ? PROMPT_1_SYSTEM : PROMPT_2_SYSTEM,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: isFirstRun ? PROMPT_1_USER(content) : PROMPT_2_USER(content),
        },
      ],
      output_config: isFirstRun ? CONFIG_1 : CONFIG_2,
    });
    console.log(msg);

    return msg;
  }

  static async batchCall(contents: ClaudeBatchContent[]) {
    try {
      const msg = await anthropic.messages.batches.create({
        requests: [
          ...contents.map((content) => ({
            custom_id: content.companyId,
            params: {
              model: 'claude-haiku-4-5-20251001',
              system: [
                {
                  type: 'text' as const,
                  text: content.htmlSelector
                    ? PROMPT_1_SYSTEM
                    : PROMPT_2_SYSTEM,
                  cache_control: { type: 'ephemeral' as const },
                },
              ],
              max_tokens: 4000,
              messages: [
                {
                  role: 'user' as const,
                  content: content.htmlSelector
                    ? PROMPT_1_USER(content.html)
                    : PROMPT_2_USER(content.html),
                },
              ],
              output_config: content.htmlSelector ? CONFIG_1 : CONFIG_2,
            },
          })),
        ],
      });

      await prisma.claudeBatchLog.create({
        data: {
          id: msg.id,
          status: msg.processing_status,
          response: msg as unknown as Prisma.InputJsonValue,
          companies: {
            connect: contents.map((content) => ({ id: content.companyId })),
          },
        },
      });

      await this.processBatch(msg.id, msg.processing_status);
      console.log(msg);

      return msg;
    } catch (error) {
      console.error(error);
    }
  }

  static async processBatch(batchId: string, status: ClaudeBatchStatus) {
    if (status == ClaudeBatchStatus.IN_PROGRESS) {
      let messageBatch;
      while (true) {
        messageBatch = await anthropic.messages.batches.retrieve(batchId);
        if (messageBatch.processing_status === ClaudeBatchStatus.ENDED) {
          await prisma.claudeBatchLog.update({
            where: { id: batchId },
            data: {
              status: messageBatch.processing_status,
              response: messageBatch as unknown as Prisma.InputJsonValue,
            },
          });
          break;
        }

        console.log(`Batch ${batchId} is still processing... waiting`);
        await new Promise((resolve) => setTimeout(resolve, 60_000));
      }
    }

    resultsLoop: for await (const result of await anthropic.messages.batches.results(
      batchId,
    )) {
      let jobsCount = 0;
      const { custom_id: companyId } = result;
      const scrapeLog = await prisma.scrapeLog.findFirstOrThrow({
        orderBy: { createdAt: 'desc' },
        where: { companyId: companyId },
      });

      switch (result.result.type) {
        case 'succeeded':
          console.log(`Success! ${JSON.stringify(result)}`);

          for (const element of result.result.message.content) {
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
                continue resultsLoop;
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
                      batch: { connect: { id: batchId } },
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
