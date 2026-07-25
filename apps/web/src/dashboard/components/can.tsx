"use client";

import type { ReactNode } from "react";
import type { PermissionKey } from "@careerslk/lib";
import { useAuth } from "@dashboard-hooks/use-auth";

interface CanProps {
  permission?: PermissionKey;
  anyOf?: PermissionKey[];
  allOf?: PermissionKey[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function Can({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}: CanProps) {
  const auth = useAuth();

  const allowed =
    (permission ? auth.can(permission) : true) &&
    (anyOf ? auth.canAny(anyOf) : true) &&
    (allOf ? auth.canAll(allOf) : true);

  return <>{allowed ? children : fallback}</>;
}
