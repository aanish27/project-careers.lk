"use client";

import { Button, buttonVariants } from "@/components/ui/button";
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
import type { SeoPageFilters } from "../api/api";
import { useSeoPages } from "../hooks/use-seo-pages";
import { columns } from "./columns";

function RowActions({ page }: { page: SeoPageSummary }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={`/admin/seo/${page.id}`}
            aria-label="View detail"
            className={buttonVariants({ variant: "outline", size: "icon-xs" })}
          >
            <IconEye />
          </Link>
        }
      />
      <TooltipContent>View detail</TooltipContent>
    </Tooltip>
  );
}

export function SeoPagesTable({
  filters,
  title = "SEO Pages",
}: {
  filters?: SeoPageFilters;
  title?: string;
} = {}) {
  const { data } = useSeoPages(filters);
  const generateAll = useGenerateAllSeoPages();

  const table = useDataTable({
    columns,
    data: data ?? [],
    getRowId: (row) => String(row.id),
    title,
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
