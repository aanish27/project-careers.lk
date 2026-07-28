import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconBuilding } from "@tabler/icons-react";
import { useScrapeCompanyJob } from "../hooks/use-scraper";
import { ConfirmScrapeDialog } from "./confirm-scrape-dialog";

export const ScrapeJobButton = ({ companyId }: { companyId: number }) => {
  const { mutate, isPending } = useScrapeCompanyJob(companyId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="success"
              size="icon-xs"
              aria-label="Scrape Jobs"
              onClick={() => setConfirmOpen(true)}
              disabled={isPending}
            >
              <IconBuilding />
            </Button>
          }
        ></TooltipTrigger>
        <TooltipContent>Scrape Jobs</TooltipContent>
      </Tooltip>
      <ConfirmScrapeDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Scrape jobs for this company?"
        description="This will queue a job-scrape run for this company immediately."
        confirmLabel="Scrape jobs"
        isPending={isPending}
        onConfirm={() => mutate()}
      />
    </>
  );
};
