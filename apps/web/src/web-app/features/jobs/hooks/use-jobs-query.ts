import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listJobsAction } from "../api/jobs.actions";
import { JobFilters, PublicJobsListResponse } from "../types";
import { jobsKeys } from "./query-keys";

export function useJobsQuery(
  filters: JobFilters,
  initialPage: PublicJobsListResponse,
) {
  // initialPage was fetched server-side for whatever filters were active on
  // first render. Only seed the cache with it for that exact filter key —
  // otherwise every later filter change would reuse this stale data (it's
  // "fresh" under the global staleTime) instead of refetching.
  const [initialQueryKey] = useState(() =>
    JSON.stringify(jobsKeys.list(filters)),
  );

  return useInfiniteQuery({
    queryKey: jobsKeys.list(filters),
    queryFn: ({ pageParam }) =>
      listJobsAction({ ...filters, cursor: pageParam ?? undefined }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData:
      JSON.stringify(jobsKeys.list(filters)) === initialQueryKey
        ? { pages: [initialPage], pageParams: [null] }
        : undefined,
    placeholderData: keepPreviousData,
  });
}
