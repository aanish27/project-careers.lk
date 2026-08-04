import { JobWithCompany } from "@careerslk/types";
import type { ColumnDef } from "@tanstack/react-table";

export const pendingColumns: ColumnDef<JobWithCompany>[] = [
  {
    accessorKey: "company",
    header: "Company",
    accessorFn: (row) => `${row.company.name}`,
  },
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    accessorKey: "employmentType",
    header: "Type",
  },
  {
    accessorKey: "source",
    header: "Source",
  },
  {
    accessorKey: "createdAt",
    header: "Submitted",
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
  },
];
