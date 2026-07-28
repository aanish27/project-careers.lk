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

  'companies.read': 'View company records',
  'companies.create': 'Add new companies to scrape',
  'companies.update': 'Edit company details and scrape configuration',
  'companies.delete': 'Remove companies',

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

  COMPANIES_READ: 'companies.read',
  COMPANIES_CREATE: 'companies.create',
  COMPANIES_UPDATE: 'companies.update',
  COMPANIES_DELETE: 'companies.delete',

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
