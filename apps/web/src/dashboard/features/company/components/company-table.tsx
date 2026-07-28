"use client";

import { Button } from "@/components/ui/button";
import { IconBriefcase } from "@tabler/icons-react";
import { DataTable, useDataTable } from "@ui/data-table";
import Link from "next/link";
import { useCompanies } from "../hooks/use-companies";
import { columns } from "./columns";
import { ScrapeCompanyButton } from "./scrape-company-button";
import { ScrapeJobButton } from "./scrape-job-button";

export function CompanyTable() {
  const { data } = useCompanies();

  const table = useDataTable({
    columns,
    data: data ?? [],
    getRowId: (row) => String(row.id),
    enableRowSelection: true,
    renderRowActions: ({ row }) => (
      <>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="View Jobs"
          render={<Link href={`/company/${row.original.id}/jobs`}></Link>}
        >
          <IconBriefcase />
        </Button>
        <ScrapeJobButton companyId={row.original.id} />
        <ScrapeCompanyButton companyId={row.original.id} />
      </>
    ),
  });

  return <DataTable table={table} />;
}
