import { Badge } from "@/components/ui/badge";
import type { SeoPageSummary } from "@careerslk/types";
import type { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<SeoPageSummary>[] = [
  {
    accessorKey: "pageType",
    header: "Type",
  },
  {
    accessorKey: "slug",
    header: "Slug",
  },
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "jobCount",
    header: "Jobs",
  },
  {
    accessorKey: "isIndexable",
    header: "Indexable",
    cell: ({ getValue }) => (
      <Badge variant={getValue<boolean>() ? "default" : "outline"}>
        {getValue<boolean>() ? "Indexable" : "Noindex"}
      </Badge>
    ),
  },
  {
    accessorKey: "needsReview",
    header: "Review",
    cell: ({ getValue }) =>
      getValue<boolean>() ? (
        <Badge variant="destructive">Needs review</Badge>
      ) : (
        "—"
      ),
  },
  {
    accessorKey: "manualOverride",
    header: "Override",
    cell: ({ getValue }) =>
      getValue<boolean>() ? <Badge variant="secondary">Manual</Badge> : "—",
  },
  {
    accessorKey: "lastGeneratedAt",
    header: "Last generated",
    cell: ({ getValue }) => {
      const value = getValue<string | null>();
      return value ? new Date(value).toLocaleString() : "—";
    },
  },
];
