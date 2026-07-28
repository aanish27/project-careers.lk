import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconBuilding } from "@tabler/icons-react";
import { useScrapeCompanyJob } from "../hooks/use-scraper";
export const ScrapeJobButton = ({ companyId }: { companyId: number }) => {
  const { mutate, isPending } = useScrapeCompanyJob(companyId);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Scrape Jobs"
            onClick={() => mutate()}
            disabled={isPending}
          >
            <IconBuilding />
          </Button>
        }
      ></TooltipTrigger>
      <TooltipContent>Scrape Jobs</TooltipContent>
    </Tooltip>
  );
};
