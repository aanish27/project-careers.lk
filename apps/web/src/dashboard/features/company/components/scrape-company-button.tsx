import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconBriefcase2 } from "@tabler/icons-react";
import { useScrapeCompany } from "../hooks/use-scraper";
export const ScrapeCompanyButton = ({ companyId }: { companyId: number }) => {
  const { mutate, isPending } = useScrapeCompany(companyId);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Scrape Company"
            onClick={() => mutate()}
            disabled={isPending}
          >
            <IconBriefcase2 />
          </Button>
        }
      ></TooltipTrigger>
      <TooltipContent>Scrape Company</TooltipContent>
    </Tooltip>
  );
};
