import type { PublicJobsListResponse } from "@web-app-features/jobs/types";
import { IBreadcrumbItem } from "@web-app-features/ui/types";
import { Suspense } from "react";
import JobsListingInteractive from "./jobs-listing-interactive";
import JobsListingStatic from "./jobs-listing-static";

type JobsListingProps = {
  pageTitle: string;
  pageDescription: string | null;
  initialPage: PublicJobsListResponse;
  slug: string;
  breadcrumbs?: IBreadcrumbItem[];
};

// JobsListingInteractive reads URL search params (via nuqs) for filtering,
// which requires a Suspense boundary on a statically-rendered/ISR route
// (Next.js: "Missing Suspense boundary with useSearchParams" build error
// otherwise). The fallback here is not a loading skeleton — it's a real,
// hook-free render of the default job list (see jobs-listing-static.tsx),
// since the fallback is what actually ships in the cached, crawler-visible
// HTML for this route.
const JobsListing = (props: JobsListingProps) => {
  return (
    <Suspense
      fallback={
        <JobsListingStatic
          pageTitle={props.pageTitle}
          pageDescription={props.pageDescription}
          initialPage={props.initialPage}
        />
      }
    >
      <JobsListingInteractive {...props} />
    </Suspense>
  );
};

export default JobsListing;
