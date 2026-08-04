import type { ColumnDef } from "@tanstack/react-table";
import type { FreelanceProfileWithWebUser } from "../api/api";

export const pendingColumns: ColumnDef<FreelanceProfileWithWebUser>[] = [
  {
    accessorKey: "webUser",
    header: "Freelancer",
    accessorFn: (row) =>
      [row.webUser.firstName, row.webUser.lastName].filter(Boolean).join(" ") ||
      row.webUser.email,
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "rate",
    header: "Rate",
    cell: ({ row }) =>
      row.original.rate
        ? `${row.original.rate} ${row.original.rateCurrency ?? ""}`
        : "—",
  },
  {
    accessorKey: "createdAt",
    header: "Submitted",
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
  },
];
