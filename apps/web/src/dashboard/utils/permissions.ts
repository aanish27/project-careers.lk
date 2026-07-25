import type { AuthUser } from "@lib/api-client";
import type { PermissionKey } from "@careerslk/lib";

type PermissionHolder = Pick<AuthUser, "permissions" | "isSuperAdmin">;

export function can(
  user: PermissionHolder | null | undefined,
  permission: PermissionKey,
): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return (user.permissions ?? []).includes(permission);
}

export function canAny(
  user: PermissionHolder | null | undefined,
  permissions: PermissionKey[],
): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  const held = user.permissions ?? [];
  return permissions.some((permission) => held.includes(permission));
}

export function canAll(
  user: PermissionHolder | null | undefined,
  permissions: PermissionKey[],
): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  const held = user.permissions ?? [];
  return permissions.every((permission) => held.includes(permission));
}
