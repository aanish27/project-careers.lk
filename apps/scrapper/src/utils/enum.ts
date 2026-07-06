export const ClaudeBatchStatus = {
  IN_PROGRESS: 'in_progress',
  CANCELING: 'canceling',
  ENDED: 'ended',
} as const;

export type ClaudeBatchStatus =
  (typeof ClaudeBatchStatus)[keyof typeof ClaudeBatchStatus];

export const AIProvider = {
  DEEPSEEK: 'deepseek',
  CLAUDE: 'claude',
} as const;

export type AIProvider = (typeof AIProvider)[keyof typeof AIProvider];

export const ScrapeType = {
  COMPANY: 'company',
  JOBS: 'jobs',
} as const;

export type ScrapeType = (typeof ScrapeType)[keyof typeof ScrapeType];
