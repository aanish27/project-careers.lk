"use client";

import { DataTable, useDataTable } from "@ui/data-table";
import { useKeywords } from "../hooks/use-keywords";
import { columns } from "./columns";

export function KeywordsTable() {
  const { data } = useKeywords();

  const table = useDataTable({
    columns,
    data: data ?? [],
    getRowId: (row) => String(row.id),
    title: "Keywords",
  });

  return <DataTable table={table} />;
}
