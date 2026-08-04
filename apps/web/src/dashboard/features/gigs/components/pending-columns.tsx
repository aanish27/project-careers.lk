import type { ColumnDef } from "@tanstack/react-table";
import type { GigWithWebUser } from "../api/api";

export const pendingColumns: ColumnDef<GigWithWebUser>[] = [
  {
    accessorKey: "postedBy",
    header: "Posted by",
    accessorFn: (row) =>
      [row.postedBy.firstName, row.postedBy.lastName]
        .filter(Boolean)
        .join(" ") || row.postedBy.email,
  },
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "budgetMin",
    header: "Budget",
    cell: ({ row }) => {
      const { budgetMin, budgetMax, budgetCurrency } = row.original;
      if (!budgetMin && !budgetMax) return "—";
      return `${budgetMin ?? ""}${budgetMin && budgetMax ? "–" : ""}${budgetMax ?? ""} ${budgetCurrency ?? ""}`;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Submitted",
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
  },
];
