"use client";

import { DataTable, useDataTable } from "@ui/data-table";
import { useAiLogs } from "../hooks/use-ai-logs";
import { columns } from "./columns";

export function AiLogsTable() {
  const { data } = useAiLogs();

  const table = useDataTable({
    columns,
    data: data ?? [],
    getRowId: (row) => row.id,
    title: "AI Logs",
  });

  return <DataTable table={table} />;
}
