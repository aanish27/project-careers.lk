import type { ScrapeLogWithCompany } from "@careerslk/types";
import type { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<ScrapeLogWithCompany>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
  },
  {
    id: "company",
    header: "Company",
    accessorFn: (row) => row.company.name,
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "triggeredBy",
    header: "Triggered by",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "jobsFound",
    header: "Jobs found",
  },
  {
    accessorKey: "durationMs",
    header: "Duration",
    cell: ({ getValue }) => `${getValue<number>()}ms`,
  },
];
