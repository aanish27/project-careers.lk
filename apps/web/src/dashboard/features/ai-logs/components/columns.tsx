import type { AiLogWithCompany } from "@careerslk/types";
import type { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<AiLogWithCompany>[] = [
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
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "model",
    header: "Model",
  },
  {
    accessorKey: "inputTokens",
    header: "Input tokens",
  },
  {
    accessorKey: "outputTokens",
    header: "Output tokens",
  },
];
