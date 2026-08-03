"use client";

import Poster from "@web-app-components/poster";
import { PrimaryNavbar } from "@web-app-components/primary-navbar";
import CategorySidebar from "@web-app-features/jobs/components/category-sidebar";
import JobCard, { type Job } from "@web-app-features/jobs/components/job-card";
import JobFilterBar from "@web-app-features/jobs/components/job-filter-bar";
import JobsNavbar from "@web-app-features/jobs/components/jobs-navbar";
import { debounce } from "lodash";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const LOCATION_DEBOUNCE_MS = 400;

type JobsListingProps = {
  jobs: Job[];
  activeCategory: string;
  location: string;
  workMode: string;
  employmentType: string;
};

type FilterUpdate = Partial<{
  sector: string;
  location: string;
  workMode: string;
  employmentType: string;
}>;

const JobsListing = ({
  jobs,
  activeCategory,
  location,
  workMode,
  employmentType,
}: JobsListingProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Mirrors `location` locally so the input feels instant while the URL
  // navigation is debounced. Resets on prop change without an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevLocationProp, setPrevLocationProp] = useState(location);
  const [locationInput, setLocationInput] = useState(location);
  if (location !== prevLocationProp) {
    setPrevLocationProp(location);
    setLocationInput(location);
  }

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
    (merged: Required<FilterUpdate>) => {
      const params = new URLSearchParams();
      if (merged.sector !== "All Jobs") params.set("sector", merged.sector);
      if (merged.location.trim())
        params.set("location", merged.location.trim());
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
        sector: update.sector ?? activeCategory,
        location: update.location ?? location,
        workMode: update.workMode ?? workMode,
        employmentType: update.employmentType ?? employmentType,
      });
    },
    [activeCategory, location, workMode, employmentType, navigate],
  );

  const debouncedLocationUpdate = useMemo(
    () =>
      debounce(
        (value: string) => updateFilters({ location: value }),
        LOCATION_DEBOUNCE_MS,
      ),
    [updateFilters],
  );

  useEffect(() => {
    return () => debouncedLocationUpdate.cancel();
  }, [debouncedLocationUpdate]);

  const handleLocationChange = (value: string) => {
    setLocationInput(value);
    debouncedLocationUpdate(value);
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      <div ref={headerRef} className="sticky top-5 z-50 flex flex-col gap-3">
        <PrimaryNavbar />
        <JobsNavbar />
      </div>

      <div className="flex flex-1 gap-8 py-8">
        <CategorySidebar
          activeCategory={activeCategory}
          onCategoryChange={(sector) => updateFilters({ sector })}
          headerHeight={headerHeight}
        />
        <div className="flex flex-1 flex-col">
          <JobFilterBar
            title="Java Developer"
            resultCount={jobs.length}
            location={locationInput}
            onLocationChange={handleLocationChange}
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
