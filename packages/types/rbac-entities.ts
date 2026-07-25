import type { PermissionKey } from './permissions';

export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Role {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: PermissionKey[];
  userCount?: number;
}

export interface PermissionCatalogEntry {
  id: number;
  key: PermissionKey;
  action: string;
  description: string | null;
}

export interface PermissionGroup {
  module: string;
  permissions: PermissionCatalogEntry[];
}
