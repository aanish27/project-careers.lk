export const PERMISSION_DESCRIPTIONS = {
  'users.read': 'View admin user accounts and the roles assigned to them',
  'users.create': 'Create new admin user accounts',
  'users.update': 'Edit admin user profile details and activation status',
  'users.delete': 'Deactivate and remove admin user accounts',
  'users.roles.assign': 'Change which roles an admin user holds',
  'users.password.reset': "Reset another admin user's password",

  'roles.read': 'View roles and the permissions they grant',
  'roles.create': 'Create new roles',
  'roles.update': 'Rename roles and edit their descriptions',
  'roles.delete': 'Delete roles that are no longer needed',
  'roles.permissions.assign': 'Change which permissions a role grants',

  'permissions.read': 'View the catalogue of available permissions',

  'jobs.read': 'View all the jobs',
  'jobs.update': 'Edit job listing details',
  'jobs.delete': 'Remove job listings',
  'jobs.approve': 'Approve or reject pending user-submitted job postings',

  'companies.read': 'View company records',
  'companies.create': 'Add new companies to scrape',
  'companies.update': 'Edit company details and scrape configuration',
  'companies.delete': 'Remove companies',
  'companies.trust':
    "Grant or revoke a company's auto-approval (trusted) status",
  'companies.claims.review':
    'Approve or reject requests to claim an existing company',

  'keywords.read': 'View the keyword catalogue and job-keyword assignments',
  'keywords.create': 'Create new keywords',
  'keywords.update': 'Rename existing keywords',
  'keywords.delete': 'Delete keywords from the catalogue',
  'keywords.assign': 'Assign, edit, or remove keywords on a job',

  'scraper.company.trigger': 'Manually trigger a company profile scrape',
  'scraper.jobs.trigger': 'Manually trigger a job listing scrape',

  'scrape-logs.read': 'View scrape run history',
  'audit-logs.read': 'View the audit trail of admin actions',
  'ai-logs.read': 'View individual AI model call logs',
  'ai-batch-logs.read': 'View AI batch job logs',
  'queue-logs.read': 'View live scraper queue state',

  'notifications.read': 'View and mark your own notifications as read',

  'dashboard.read': 'View the platform overview dashboard',

  'seo.read': 'View generated SEO pages and their content',
  'seo.update':
    'Manually override SEO page content, indexability, and lifecycle',

  'freelance-profiles.read': 'View freelance profiles',
  'freelance-profiles.approve': 'Approve or reject pending freelance profiles',
  'freelance-profiles.delete': 'Remove freelance profiles',

  'gigs.read': 'View gig postings',
  'gigs.approve': 'Approve or reject pending gig postings',
  'gigs.delete': 'Remove gig postings',

  'reports.read': 'View filed abuse/report submissions',
  'reports.review': 'Mark reports as reviewed or dismiss them',
} as const;

export type PermissionKey = keyof typeof PERMISSION_DESCRIPTIONS;

export const PERMISSIONS = {
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_ROLES_ASSIGN: 'users.roles.assign',
  USERS_PASSWORD_RESET: 'users.password.reset',

  ROLES_READ: 'roles.read',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  ROLES_PERMISSIONS_ASSIGN: 'roles.permissions.assign',

  PERMISSIONS_READ: 'permissions.read',

  JOBS_READ: 'jobs.read',
  JOBS_UPDATE: 'jobs.update',
  JOBS_DELETE: 'jobs.delete',
  JOBS_APPROVE: 'jobs.approve',

  COMPANIES_READ: 'companies.read',
  COMPANIES_CREATE: 'companies.create',
  COMPANIES_UPDATE: 'companies.update',
  COMPANIES_DELETE: 'companies.delete',
  COMPANIES_TRUST: 'companies.trust',
  COMPANIES_CLAIMS_REVIEW: 'companies.claims.review',

  KEYWORDS_READ: 'keywords.read',
  KEYWORDS_CREATE: 'keywords.create',
  KEYWORDS_UPDATE: 'keywords.update',
  KEYWORDS_DELETE: 'keywords.delete',
  KEYWORDS_ASSIGN: 'keywords.assign',

  SCRAPER_COMPANY_TRIGGER: 'scraper.company.trigger',
  SCRAPER_JOBS_TRIGGER: 'scraper.jobs.trigger',

  SCRAPE_LOGS_READ: 'scrape-logs.read',
  AUDIT_LOGS_READ: 'audit-logs.read',
  AI_LOGS_READ: 'ai-logs.read',
  AI_BATCH_LOGS_READ: 'ai-batch-logs.read',
  QUEUE_LOGS_READ: 'queue-logs.read',

  NOTIFICATIONS_READ: 'notifications.read',

  DASHBOARD_READ: 'dashboard.read',

  SEO_READ: 'seo.read',
  SEO_UPDATE: 'seo.update',

  FREELANCE_PROFILES_READ: 'freelance-profiles.read',
  FREELANCE_PROFILES_APPROVE: 'freelance-profiles.approve',
  FREELANCE_PROFILES_DELETE: 'freelance-profiles.delete',

  GIGS_READ: 'gigs.read',
  GIGS_APPROVE: 'gigs.approve',
  GIGS_DELETE: 'gigs.delete',

  REPORTS_READ: 'reports.read',
  REPORTS_REVIEW: 'reports.review',
} as const satisfies Record<string, PermissionKey>;

// Compile error if a PERMISSION_DESCRIPTIONS key has no matching PERMISSIONS constant.
type UncoveredPermissions = Exclude<
  PermissionKey,
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
>;
type _AssertEveryPermissionHasAConstant = UncoveredPermissions extends never
  ? true
  : ['Missing PERMISSIONS constant for', UncoveredPermissions];
const _permissionsAreExhaustive: _AssertEveryPermissionHasAConstant = true;
void _permissionsAreExhaustive;

export const ALL_PERMISSION_KEYS = Object.keys(
  PERMISSION_DESCRIPTIONS,
) as PermissionKey[];

export const SUPER_ADMIN_ROLE_SLUG = 'super_admin';

export function parsePermissionKey(key: PermissionKey): {
  module: string;
  action: string;
} {
  const segments = key.split('.');
  return {
    module: segments[0],
    action: segments[segments.length - 1],
  };
}
