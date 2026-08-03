"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SeoPageSummary } from "@careerslk/types";
import { IconEye, IconRefresh } from "@tabler/icons-react";
import { DataTable, useDataTable } from "@ui/data-table";
import Link from "next/link";
import { useGenerateAllSeoPages } from "../hooks/use-seo-page-actions";
import { useSeoPages } from "../hooks/use-seo-pages";
import { columns } from "./columns";

function RowActions({ page }: { page: SeoPageSummary }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon-xs"
            aria-label="View detail"
            render={<Link href={`/admin/seo/${page.id}`}></Link>}
          >
            <IconEye />
          </Button>
        }
      />
      <TooltipContent>View detail</TooltipContent>
    </Tooltip>
  );
}

export function SeoPagesTable() {
  const { data } = useSeoPages();
  const generateAll = useGenerateAllSeoPages();

  const table = useDataTable({
    columns,
    data: data ?? [],
    getRowId: (row) => String(row.id),
    title: "SEO Pages",
    enableColumnResizing: true,
    enableGrouping: true,
    renderRowActions: ({ row }) => <RowActions page={row.original} />,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          onClick={() => generateAll.mutate()}
          disabled={generateAll.isPending}
        >
          <IconRefresh />
          {generateAll.isPending ? "Generating…" : "Run generation now"}
        </Button>
      </div>
      <DataTable table={table} />
    </div>
  );
}
