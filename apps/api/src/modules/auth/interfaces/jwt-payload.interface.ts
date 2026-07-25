import { PermissionKey } from '@careerslk/lib';

export interface JwtPayload {
  sub: number;
  email: string;
}

export interface AuthenticatedPrincipal {
  userId: number;
  email: string;
  isActive: boolean;
  roleSlugs: ReadonlySet<string>;
  permissions: ReadonlySet<PermissionKey>;
  isSuperAdmin: boolean;
}
