"use client";

import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@careerslk/lib";
import { Can } from "@dashboard-components/can";
import { useScrapeCompanies, useScrapeCompanyJobs } from "../hooks/use-scraper";

export function BulkScrapeToolbar({ companyIds }: { companyIds: number[] }) {
  const scrapeCompanies = useScrapeCompanies(companyIds);
  const scrapeJobs = useScrapeCompanyJobs(companyIds);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {companyIds.length} selected
      </span>
      <Can permission={PERMISSIONS.SCRAPER_COMPANY_TRIGGER}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => scrapeCompanies.mutate()}
          disabled={scrapeCompanies.isPending}
        >
          {scrapeCompanies.isPending ? "Queuing…" : "Scrape company"}
        </Button>
      </Can>
      <Can permission={PERMISSIONS.SCRAPER_JOBS_TRIGGER}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => scrapeJobs.mutate()}
          disabled={scrapeJobs.isPending}
        >
          {scrapeJobs.isPending ? "Queuing…" : "Scrape jobs"}
        </Button>
      </Can>
    </div>
  );
}
