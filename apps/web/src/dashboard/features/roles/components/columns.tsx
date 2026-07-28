import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@careerslk/types";

export const columns: ColumnDef<Role>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.name}
        {row.original.isSystem && <Badge variant="secondary">System</Badge>}
      </div>
    ),
  },
  { accessorKey: "slug", header: "Slug" },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ getValue }) => getValue<string | null>() ?? "—",
  },
  {
    id: "permissionCount",
    header: "Permissions",
    accessorFn: (row) => row.permissions.length,
  },
  {
    accessorKey: "userCount",
    header: "Users",
    cell: ({ getValue }) => getValue<number | undefined>() ?? 0,
  },
];
