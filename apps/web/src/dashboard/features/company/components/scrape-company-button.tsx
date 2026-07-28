import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconBriefcase2 } from "@tabler/icons-react";
import { useScrapeCompany } from "../hooks/use-scraper";
import { ConfirmScrapeDialog } from "./confirm-scrape-dialog";

export const ScrapeCompanyButton = ({ companyId }: { companyId: number }) => {
  const { mutate, isPending } = useScrapeCompany(companyId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="success"
              size="icon-xs"
              aria-label="Scrape Company"
              onClick={() => setConfirmOpen(true)}
              disabled={isPending}
            >
              <IconBriefcase2 />
            </Button>
          }
        ></TooltipTrigger>
        <TooltipContent>Scrape Company</TooltipContent>
      </Tooltip>
      <ConfirmScrapeDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Scrape this company?"
        description="This will queue a scrape job to fetch this company's job postings immediately."
        confirmLabel="Scrape company"
        isPending={isPending}
        onConfirm={() => mutate()}
      />
    </>
  );
};
