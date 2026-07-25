"use client";

import { DataTable, useDataTable } from "@ui/data-table";
import { useCompanies } from "../hooks/use-companies";
import { columns } from "./columns";

export function CompanyTable() {
  const { data } = useCompanies();

  const table = useDataTable({
    columns,
    data: data ?? [],
    getRowId: (row) => String(row.id),
  });

  return <DataTable table={table} />;
}
