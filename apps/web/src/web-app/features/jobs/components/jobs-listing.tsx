"use client";

import Poster from "@web-app-components/poster";
import { PrimaryNavbar } from "@web-app-components/primary-navbar";
import CategorySidebar from "@web-app-features/jobs/components/category-sidebar";
import JobCard from "@web-app-features/jobs/components/job-card";
import JobFilterBar from "@web-app-features/jobs/components/job-filter-bar";
import JobsNavbar from "@web-app-features/jobs/components/jobs-navbar";
import type { PublicJob } from "@web-app-features/jobs/types";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

type JobsListingProps = {
  jobs: PublicJob[];
  activeCategory: string;
  province: string;
  district: string;
  workMode: string;
  employmentType: string;
};

interface NavigateParams {
  province: string;
  district: string;
  workMode: string;
  employmentType: string;
}

type FilterUpdate = Partial<NavigateParams>;

const JobsListing = ({
  jobs,
  activeCategory,
  province,
  district,
  workMode,
  employmentType,
}: JobsListingProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      setHeaderHeight(entry.contentRect.height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const navigate = useCallback(
    (merged: NavigateParams) => {
      const params = new URLSearchParams();
      if (merged.province !== "all") params.set("province", merged.province);
      if (merged.district !== "all") params.set("district", merged.district);
      if (merged.workMode !== "all") params.set("workMode", merged.workMode);
      if (merged.employmentType !== "all")
        params.set("employmentType", merged.employmentType);

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  const updateFilters = useCallback(
    (update: FilterUpdate) => {
      navigate({
        province: update.province ?? province,
        district: update.district ?? district,
        workMode: update.workMode ?? workMode,
        employmentType: update.employmentType ?? employmentType,
      });
    },
    [province, district, workMode, employmentType, navigate],
  );

  return (
    <div className="relative flex min-h-screen flex-col">
      <div ref={headerRef} className="sticky top-5 z-50 flex flex-col gap-3">
        <PrimaryNavbar />
        <JobsNavbar />
      </div>

      <div className="flex flex-1 gap-8 py-8">
        <CategorySidebar
          activeCategory={activeCategory}
          headerHeight={headerHeight}
        />
        <div className="flex flex-1 flex-col">
          <JobFilterBar
            resultCount={jobs.length}
            province={province}
            onProvinceChange={(value) =>
              updateFilters({ province: value, district: "all" })
            }
            district={district}
            onDistrictChange={(value) => updateFilters({ district: value })}
            workMode={workMode}
            onWorkModeChange={(value) => updateFilters({ workMode: value })}
            employmentType={employmentType}
            onEmploymentTypeChange={(value) =>
              updateFilters({ employmentType: value })
            }
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job, index) => (
              <JobCard key={job.id} job={job} index={index} />
            ))}
          </div>
        </div>
      </div>

      <Poster />
    </div>
  );
};

export default JobsListing;
