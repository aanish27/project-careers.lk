import type { AuditLogWithActor } from "@careerslk/types";
import type { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<AuditLogWithActor>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
  },
  {
    accessorKey: "action",
    header: "Action",
  },
  {
    accessorKey: "entityType",
    header: "Entity",
  },
  {
    accessorKey: "entityId",
    header: "Entity ID",
  },
  {
    id: "actor",
    header: "Actor",
    accessorFn: (row) => row.actor?.email ?? row.actorEmail ?? "System",
  },
];
