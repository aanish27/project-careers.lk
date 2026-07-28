"use client";

import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@careerslk/lib";
import { Can } from "@dashboard-components/can";
import { IconBriefcase2, IconBuilding } from "@tabler/icons-react";
import { useScrapeCompanies, useScrapeCompanyJobs } from "../hooks/use-scraper";
import { ConfirmScrapeDialog } from "./confirm-scrape-dialog";

export function BulkScrapeToolbar({ companyIds }: { companyIds: number[] }) {
  const scrapeCompanies = useScrapeCompanies(companyIds);
  const scrapeJobs = useScrapeCompanyJobs(companyIds);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {companyIds.length} selected
      </span>
      <Can permission={PERMISSIONS.SCRAPER_COMPANY_TRIGGER}>
        <ConfirmScrapeDialog
          title="Scrape selected companies?"
          description={`This will queue a scrape job for ${companyIds.length} selected ${companyIds.length === 1 ? "company" : "companies"} immediately.`}
          confirmLabel="Scrape company"
          isPending={scrapeCompanies.isPending}
          onConfirm={() => scrapeCompanies.mutate()}
        >
          <Button
            variant="outline"
            size="sm"
            className="border-success/40 text-success hover:bg-success/10 hover:text-success"
            disabled={scrapeCompanies.isPending}
          >
            <IconBriefcase2 />
            {scrapeCompanies.isPending ? "Queuing…" : "Scrape company"}
          </Button>
        </ConfirmScrapeDialog>
      </Can>
      <Can permission={PERMISSIONS.SCRAPER_JOBS_TRIGGER}>
        <ConfirmScrapeDialog
          title="Scrape jobs for selected companies?"
          description={`This will queue a job-scrape run for ${companyIds.length} selected ${companyIds.length === 1 ? "company" : "companies"} immediately.`}
          confirmLabel="Scrape jobs"
          isPending={scrapeJobs.isPending}
          onConfirm={() => scrapeJobs.mutate()}
        >
          <Button
            variant="outline"
            size="sm"
            className="border-success/40 text-success hover:bg-success/10 hover:text-success"
            disabled={scrapeJobs.isPending}
          >
            <IconBuilding />
            {scrapeJobs.isPending ? "Queuing…" : "Scrape jobs"}
          </Button>
        </ConfirmScrapeDialog>
      </Can>
    </div>
  );
}
