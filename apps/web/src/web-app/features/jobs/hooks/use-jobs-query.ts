import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { listJobsAction } from "../api/jobs.actions";
import { JobFilters, PublicJobsListResponse } from "../types";
import { jobsKeys } from "./query-keys";

export function useJobsQuery(
  filters: JobFilters,
  initialPage: PublicJobsListResponse,
) {
  return useInfiniteQuery({
    queryKey: jobsKeys.list(filters),
    queryFn: ({ pageParam }) =>
      listJobsAction({ ...filters, cursor: pageParam ?? undefined }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: { pages: [initialPage], pageParams: [null] },
    placeholderData: keepPreviousData,
  });
}
