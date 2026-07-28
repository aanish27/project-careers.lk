"use client";

import { DataTable, useDataTable } from "@ui/data-table";
import { useAiBatchLogs } from "../hooks/use-ai-batch-logs";
import { columns } from "./columns";

export function AiBatchLogsTable() {
  const { data } = useAiBatchLogs();

  const table = useDataTable({
    columns,
    data: data ?? [],
    getRowId: (row) => row.id,
    title: "AI Batch Logs",
  });

  return <DataTable table={table} />;
}
