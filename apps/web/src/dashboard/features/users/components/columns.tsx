import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { AdminUser } from "../types/user.types";

export const columns: ColumnDef<AdminUser>[] = [
  {
    id: "name",
    header: "Name",
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    id: "roles",
    header: "Roles",
    accessorFn: (row) => row.roles,
    cell: ({ getValue }) => {
      const roles = getValue<string[]>();
      if (roles.length === 0) {
        return <span className="text-muted-foreground">No roles</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {roles.map((role) => (
            <Badge key={role} variant="secondary">
              {role}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ getValue }) => (
      <Badge variant={getValue<boolean>() ? "default" : "destructive"}>
        {getValue<boolean>() ? "Active" : "Blocked"}
      </Badge>
    ),
  },
  {
    accessorKey: "lastLoginAt",
    header: "Last login",
    cell: ({ getValue }) => {
      const value = getValue<string | null>();
      return value ? new Date(value).toLocaleString() : "Never";
    },
  },
];
