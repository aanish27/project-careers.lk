"use client";

import { useContext } from "react";
import type { PermissionKey } from "@careerslk/types";
import type { AuthUser } from "@lib/api-client";
import { AuthContext } from "@dashboard-components/auth-provider";
import { can, canAll, canAny } from "@dashboard-utils/permissions";

interface UseAuthResult {
  user: AuthUser;
  can: (permission: PermissionKey) => boolean;
  canAny: (permissions: PermissionKey[]) => boolean;
  canAll: (permissions: PermissionKey[]) => boolean;
}

export function useAuth(): UseAuthResult {
  const user = useContext(AuthContext);

  if (!user) {
    throw new Error(
      "useAuth() must be used inside <AuthProvider>. " +
        "Dashboard pages receive the user from the server layout.",
    );
  }

  return {
    user,
    can: (permission) => can(user, permission),
    canAny: (permissions) => canAny(user, permissions),
    canAll: (permissions) => canAll(user, permissions),
  };
}
