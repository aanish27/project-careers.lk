import type { KeywordWithJobCount } from "@careerslk/types";
import type { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<KeywordWithJobCount>[] = [
  {
    accessorKey: "name",
    header: "Keyword",
  },
  {
    id: "jobCount",
    header: "Jobs",
    accessorFn: (row) => row._count.jobs,
  },
];
