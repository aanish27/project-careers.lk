import type { AbuseReportWithReporter } from "@careerslk/types";
import type { ColumnDef } from "@tanstack/react-table";

export const pendingColumns: ColumnDef<AbuseReportWithReporter>[] = [
  {
    accessorKey: "reporter",
    header: "Reporter",
    accessorFn: (row) =>
      [row.reporter.firstName, row.reporter.lastName]
        .filter(Boolean)
        .join(" ") || row.reporter.email,
  },
  {
    accessorKey: "entityType",
    header: "Entity",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "contentSnapshot",
    header: "Content",
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return value.length > 120 ? `${value.slice(0, 120)}…` : value;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Filed",
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
  },
];
