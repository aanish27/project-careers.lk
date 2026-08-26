"use client";

import { Spinner } from "@/components/ui/spinner";
import JobCard from "@web-app-features/jobs/components/job-card";
import JobFilterBar from "@web-app-features/jobs/components/job-filter-bar";
import type { PublicJobsListResponse } from "@web-app-features/jobs/types";
import { IBreadcrumbItem } from "@web-app-features/ui/types";
import { useQueryStates } from "nuqs";
import { useEffect, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import { jobFiltersParsers } from "../hooks/job-filters-search-params";
import { useJobsQuery } from "../hooks/use-jobs-query";

type JobsListingProps = {
  pageTitle: string;
  pageDescription: string | null;
  initialPage: PublicJobsListResponse;
  slug: string;
  breadcrumbs?: IBreadcrumbItem[];
};

const JobsListing = ({
  pageTitle,
  pageDescription,
  initialPage,
  slug,
  breadcrumbs,
}: JobsListingProps) => {
  const [filters, setFilters] = useQueryStates(jobFiltersParsers, {
    shallow: true, // update the URL without a server round-trip
    clearOnDefault: true, // drop empty [] params from the URL
  });
  const { data, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useJobsQuery({ ...filters, slug }, initialPage);

  const jobItems = data.pages.flatMap((page) => page.items);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const debouncedFetchNext = useDebouncedCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, 300);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) debouncedFetchNext();
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [debouncedFetchNext]);

  return (
    <>
      <div className="flex flex-col py-3">
        <h1 className="text-xl font-bold text-foreground">
          {pageTitle}
          <span className="text-xs font-normal text-muted-foreground">
            ({jobItems.length})
          </span>
        </h1>
        {pageDescription && <div className="text-md">{pageDescription}</div>}
      </div>

      <JobFilterBar
        province={filters.province}
        onProvinceChange={(value) =>
          setFilters({ province: value, district: [] })
        }
        district={filters.district}
        onDistrictChange={(value) => setFilters({ district: value })}
        workMode={filters.workMode}
        onWorkModeChange={(value) => setFilters({ workMode: value })}
        employmentType={filters.employmentType}
        onEmploymentTypeChange={(value) =>
          setFilters({ employmentType: value })
        }
        breadcrumbs={breadcrumbs}
      />

      <div
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 transition-opacity"
        style={{ opacity: isFetching && !isFetchingNextPage ? 0.6 : 1 }}
      >
        {jobItems.map((job, index) => (
          <JobCard key={job.id} job={job} index={index} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <Spinner className="size-6" />
        </div>
      )}

      {!hasNextPage && jobItems.length > 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No more jobs
        </p>
      )}
    </>
  );
};

export default JobsListing;
