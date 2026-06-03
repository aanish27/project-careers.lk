export const ClaudeBatchStatus = {
  IN_PROGRESS: 'in_progress',
  CANCELING: 'canceling',
  ENDED: 'ended',
} as const;

export type ClaudeBatchStatus =
  (typeof ClaudeBatchStatus)[keyof typeof ClaudeBatchStatus];
