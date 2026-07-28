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
