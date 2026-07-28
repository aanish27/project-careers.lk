"use client";

import { DataTable, useDataTable } from "@ui/data-table";
import { useAuditLogs } from "../hooks/use-audit-logs";
import { columns } from "./columns";

export function AuditLogsTable() {
  const { data } = useAuditLogs();

  const table = useDataTable({
    columns,
    data: data ?? [],
    getRowId: (row) => String(row.id),
    title: "Audit Logs",
  });

  return <DataTable table={table} />;
}
