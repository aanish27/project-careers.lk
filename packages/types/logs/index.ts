import type { Company } from '../company';
import type { Job } from '../jobs';

export interface AiLog {
  id: string;
  companyId: number;
  scrapeLogId: number;
  batchId: string | null;
  status: string;
  stopReason: string | null;
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiLogWithCompany extends AiLog {
  company: Pick<Company, 'id' | 'name'>;
}

export interface AiBatchLog {
  id: string;
  status: string;
  response: unknown;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiBatchLogDetail extends AiBatchLog {
  aiLogs: AiLog[];
  jobs: Pick<Job, 'id' | 'title'>[];
  companies: Pick<Company, 'id' | 'name'>[];
}

export interface QueueLogJob {
  id: string | null;
  name: string;
  state: string;
  data: unknown;
  attemptsMade: number;
  failedReason: string | null;
  timestamp: number;
  processedOn: number | null;
  finishedOn: number | null;
}

export interface QueueLogSnapshot {
  queue: string;
  counts: Record<string, number>;
  jobs: QueueLogJob[];
}
