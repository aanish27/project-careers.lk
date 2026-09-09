import type { PublicJobsListResponse } from "@web-app-features/jobs/types";
import JobsGrid from "./jobs-grid";

type JobsListingStaticProps = {
  pageTitle: string;
  pageDescription: string | null;
  initialPage: PublicJobsListResponse;
};

// The Suspense fallback for JobsListing (see jobs-listing.tsx). Since this
// route has no PPR/cacheComponents, whatever sits in that fallback is the
// only thing that ends up in the cached/crawler-visible HTML — the real,
// useSearchParams-dependent interactive version is deferred to client-side
// rendering entirely. So this has to be a genuine, hook-free render of the
// default job list, not a loading skeleton.
const JobsListingStatic = ({
  pageTitle,
  pageDescription,
  initialPage,
}: JobsListingStaticProps) => {
  return (
    <>
      <div className="flex flex-col py-3">
        <h1 className="text-xl font-bold text-foreground">
          {pageTitle}
          <span className="text-xs font-normal text-muted-foreground">
            ({initialPage.items.length})
          </span>
        </h1>
        {pageDescription && <div className="text-md">{pageDescription}</div>}
      </div>

      <JobsGrid jobs={initialPage.items} />
    </>
  );
};

export default JobsListingStatic;
