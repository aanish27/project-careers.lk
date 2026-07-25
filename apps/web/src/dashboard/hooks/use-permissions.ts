"use client";

import { useQuery } from "@tanstack/react-query";
import type { PermissionGroup } from "@careerslk/types";
import { api } from "@dashboard-lib/axios";

export const permissionsQueryKey = ["permissions"] as const;

const EMPTY: PermissionGroup[] = [];

export function usePermissions() {
  const query = useQuery({
    queryKey: permissionsQueryKey,
    queryFn: () =>
      api.get<PermissionGroup[]>("/admin/permissions").then((res) => res.data),
    staleTime: 10 * 60 * 1000,
  });

  return {
    groups: query.data ?? EMPTY,
    isLoading: query.isLoading,
    error: query.error,
  };
}
