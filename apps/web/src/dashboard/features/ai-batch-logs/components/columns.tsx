import type { AiBatchLog } from "@careerslk/types";
import type { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<AiBatchLog>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
  },
  {
    accessorKey: "id",
    header: "Batch ID",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
];
