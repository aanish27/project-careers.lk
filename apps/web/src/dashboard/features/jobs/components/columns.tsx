import { stripHtmlToText } from "@/lib/sanitize-html";
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
    accessorKey: "salaryPeriod",
    header: "Salary Period",
  },
  {
    accessorKey: "description",
    header: "Description",
    // Stored as HTML from the poster's rich-text editor — show plain text
    // in this table cell rather than raw tags.
    cell: ({ getValue }) => {
      const value = getValue<string | null>();
      return value ? stripHtmlToText(value) : "";
    },
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
    accessorKey: "cvEmail",
    header: "CV Email",
  },
  {
    accessorKey: "walkIn",
    header: "Walk-in",
    cell: ({ getValue }) => (getValue<boolean>() ? "Yes" : "No"),
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
