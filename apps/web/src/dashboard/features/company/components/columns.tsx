import type { Company } from "@careerslk/types";
import type { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<Company>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "websiteUrl",
    header: "Website",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "atsPlatform",
    header: "ATS Platform",
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
  },
];
