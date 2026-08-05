import { JobWithCompany } from "@careerslk/types";
import type { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<JobWithCompany>[] = [
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
    accessorKey: "workMode",
    header: "Work Mode",
  },
  {
    accessorKey: "employmentType",
    header: "Type",
  },
  {
    accessorKey: "sector",
    header: "Sector",
  },
  {
    accessorKey: "roleCategory",
    header: "Category",
  },

  {
    accessorKey: "salaryMin",
    header: "Salary Min",
  },
  {
    accessorKey: "salaryMax",
    header: "Salary Max",
  },
  {
    accessorKey: "salaryCurrency",
    header: "Salary Currency",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "deadline",
    header: "Deadline",
  },
  {
    accessorKey: "applyUrl",
    header: "Apply Url",
  },
  {
    accessorKey: "salaryRaw",
    header: "Salary",
  },
  {
    accessorKey: "status",
    header: "Status",
    // cell: ({ getValue }) => (
    //   <Badge variant={getValue<boolean>() ? "default" : "destructive"}>
    //     {getValue<boolean>() ? "Active" : "Blocked"}
    //   </Badge>
    // ),
  },
  {
    accessorKey: "lastSeenAt",
    header: "Last Seen",
    cell: ({ getValue }) => {
      const value = getValue<string | null>();
      return value ? new Date(value).toLocaleString() : "Never";
    },
  },
];
