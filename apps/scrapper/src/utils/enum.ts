export const ClaudeBatchStatus = {
  IN_PROGRESS: 'in_progress',
  CANCELING: 'canceling',
  ENDED: 'ended',
} as const;

export type ClaudeBatchStatus =
  (typeof ClaudeBatchStatus)[keyof typeof ClaudeBatchStatus];

export const PaginationType = {
  INFINITE_SCROLLING: 'infinite_scrolling',
  LOAD_MORE_BUTTON: 'load_more_button',
  NEXT_BUTTON: 'next_button',
  PAGINATION_NUMBERS: 'pagination_numbers',
} as const;

export type PaginationType =
  (typeof PaginationType)[keyof typeof PaginationType];

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
