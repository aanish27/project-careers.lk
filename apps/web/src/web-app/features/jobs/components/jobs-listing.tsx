"use client";

import Poster from "@web-app-components/poster";
import { PrimaryNavbar } from "@web-app-components/primary-navbar";
import CategorySidebar from "@web-app-features/jobs/components/category-sidebar";
import JobCard from "@web-app-features/jobs/components/job-card";
import JobFilterBar from "@web-app-features/jobs/components/job-filter-bar";
import JobsNavbar from "@web-app-features/jobs/components/jobs-navbar";
import type { PublicJob } from "@web-app-features/jobs/types";
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
  jobs: PublicJob[];
  activeCategory: string;
  location: string;
  workMode: string;
  employmentType: string;
  salaryMin?: number;
  salaryMax?: number;
  skills: string[];
};

interface NavigateParams {
  location: string;
  workMode: string;
  employmentType: string;
  salaryMin: number | undefined;
  salaryMax: number | undefined;
  skills: string[];
}

type FilterUpdate = Partial<NavigateParams>;

const JobsListing = ({
  jobs,
  activeCategory,
  location,
  workMode,
  employmentType,
  salaryMin,
  salaryMax,
  skills,
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
    (merged: NavigateParams) => {
      const params = new URLSearchParams();
      if (merged.location.trim())
        params.set("location", merged.location.trim());
      if (merged.workMode !== "all") params.set("workMode", merged.workMode);
      if (merged.employmentType !== "all")
        params.set("employmentType", merged.employmentType);
      if (merged.salaryMin !== undefined)
        params.set("salaryMin", String(merged.salaryMin));
      if (merged.salaryMax !== undefined)
        params.set("salaryMax", String(merged.salaryMax));
      if (merged.skills.length) params.set("skills", merged.skills.join(","));

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
        location: update.location ?? location,
        workMode: update.workMode ?? workMode,
        employmentType: update.employmentType ?? employmentType,
        salaryMin: "salaryMin" in update ? update.salaryMin : salaryMin,
        salaryMax: "salaryMax" in update ? update.salaryMax : salaryMax,
        skills: update.skills ?? skills,
      });
    },
    [
      location,
      workMode,
      employmentType,
      salaryMin,
      salaryMax,
      skills,
      navigate,
    ],
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
          headerHeight={headerHeight}
        />
        <div className="flex flex-1 flex-col">
          <JobFilterBar
            resultCount={jobs.length}
            location={locationInput}
            onLocationChange={handleLocationChange}
            workMode={workMode}
            onWorkModeChange={(value) => updateFilters({ workMode: value })}
            employmentType={employmentType}
            onEmploymentTypeChange={(value) =>
              updateFilters({ employmentType: value })
            }
            salaryMin={salaryMin}
            salaryMax={salaryMax}
            onSalaryChange={(min, max) =>
              updateFilters({ salaryMin: min, salaryMax: max })
            }
            skills={skills}
            onSkillsChange={(next) => updateFilters({ skills: next })}
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
