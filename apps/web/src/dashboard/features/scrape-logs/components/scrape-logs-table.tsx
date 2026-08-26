"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ScrapeLogWithCompany } from "@careerslk/types";
import { IconEye } from "@tabler/icons-react";
import { DataTable, useDataTable } from "@ui/data-table";
import Link from "next/link";
import { useScrapeLogs } from "../hooks/use-scrape-logs";
import { columns } from "./columns";

function RowActions({ log }: { log: ScrapeLogWithCompany }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={`/admin/logs/scrapes/${log.id}`}
            aria-label="View detail"
            className={buttonVariants({ variant: "info", size: "icon-xs" })}
          >
            <IconEye />
          </Link>
        }
      />
      <TooltipContent>View detail</TooltipContent>
    </Tooltip>
  );
}

export function ScrapeLogsTable() {
  const { data } = useScrapeLogs();

  const table = useDataTable({
    columns,
    data: data ?? [],
    getRowId: (row) => String(row.id),
    title: "Scrape Logs",
    renderRowActions: ({ row }) => <RowActions log={row.original} />,
  });

  return <DataTable table={table} />;
}
