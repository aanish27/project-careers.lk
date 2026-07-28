"use client";

import { Button } from "@/components/ui/button";
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
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="View detail"
            render={<Link href={`/admin/logs/scrapes/${log.id}`}></Link>}
          >
            <IconEye />
          </Button>
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
