export const AUDIT_ACTIONS = {
  ROLE_CREATED: 'role.created',
  ROLE_UPDATED: 'role.updated',
  ROLE_DELETED: 'role.deleted',
  ROLE_PERMISSIONS_CHANGED: 'role.permissions.changed',
  USER_ROLES_CHANGED: 'user.roles.changed',
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DEACTIVATED: 'user.deactivated',
  USER_PASSWORD_RESET: 'user.password.reset',
  USER_DELETED: 'user.deleted',

  COMPANY_CREATED: 'company.created',
  COMPANY_UPDATED: 'company.updated',
  COMPANY_DELETED: 'company.deleted',

  KEYWORD_CREATED: 'keyword.created',
  KEYWORD_UPDATED: 'keyword.updated',
  KEYWORD_DELETED: 'keyword.deleted',
  JOB_KEYWORD_ASSIGNED: 'job.keyword.assigned',
  JOB_KEYWORD_UPDATED: 'job.keyword.updated',
  JOB_KEYWORD_REMOVED: 'job.keyword.removed',

  SCRAPE_COMPANY_TRIGGERED: 'scrape.company.triggered',
  SCRAPE_JOBS_TRIGGERED: 'scrape.jobs.triggered',

  JOB_UPDATED: 'job.updated',
  JOB_DELETED: 'job.deleted',

  SEO_PAGE_UPDATED: 'seo.page.updated',
  SEO_PAGE_REGENERATED: 'seo.page.regenerated',
  SEO_PAGE_DEACTIVATED: 'seo.page.deactivated',
  SEO_PAGE_REACTIVATED: 'seo.page.reactivated',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
