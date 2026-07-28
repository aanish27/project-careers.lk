"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { JobWithCompany } from "@careerslk/types";
import { IconEye } from "@tabler/icons-react";
import { DataTable, useDataTable } from "@ui/data-table";
import Link from "next/link";
import { useJobs } from "../hooks/use-jobs";
import { columns } from "./columns";

function RowActions({ job }: { job: JobWithCompany }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="View detail"
            render={<Link href={`/admin/jobs/${job.id}`}></Link>}
          >
            <IconEye />
          </Button>
        }
      />
      <TooltipContent>View detail</TooltipContent>
    </Tooltip>
  );
}

export function JobsTable({ companyId }: { companyId?: number } = {}) {
  const { data } = useJobs(companyId ? { companyId } : undefined);

  const table = useDataTable({
    columns,
    data: data ?? [],
    getRowId: (row) => String(row.id),
    title: "Jobs",
    enableColumnResizing: true,
    enableGrouping: true,
    renderRowActions: ({ row }) => <RowActions job={row.original} />,
  });

  return <DataTable table={table} />;
}
