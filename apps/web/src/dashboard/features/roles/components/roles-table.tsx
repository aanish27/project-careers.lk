"use client";

import { useState } from "react";
import { PERMISSIONS } from "@careerslk/lib";
import { DataTable, useDataTable } from "@ui/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Can } from "@dashboard-components/can";
import { DeleteRoleDialog } from "./delete-role-dialog";
import { RoleFormDialog } from "./role-form-dialog";
import { RolePermissionsDialog } from "./role-permissions-dialog";
import { columns } from "./columns";
import { NewRoleButton } from "./new-role-button";
import { useRoles } from "../hooks/use-roles";
import type { Role } from "@careerslk/types";

type ActiveDialog = "edit" | "permissions" | "delete" | null;

// See users-table.tsx's RowActions for why dialogs are siblings of the
// DropdownMenu rather than nested inside it.
function RowActions({ role }: { role: Role }) {
  const locked = role.isSystem;
  const hasUsers = (role.userCount ?? 0) > 0;
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm">
            Actions
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <Can permission={PERMISSIONS.ROLES_UPDATE}>
          <DropdownMenuItem
            disabled={locked}
            onClick={() => setActiveDialog("edit")}
          >
            Edit
          </DropdownMenuItem>
        </Can>
        <Can permission={PERMISSIONS.ROLES_PERMISSIONS_ASSIGN}>
          <DropdownMenuItem
            disabled={locked}
            onClick={() => setActiveDialog("permissions")}
          >
            Manage permissions
          </DropdownMenuItem>
        </Can>
        <Can permission={PERMISSIONS.ROLES_DELETE}>
          <DropdownMenuItem
            variant="destructive"
            disabled={locked || hasUsers}
            onClick={() => setActiveDialog("delete")}
          >
            Delete
          </DropdownMenuItem>
        </Can>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {locked || hasUsers ? (
        <Tooltip>
          <TooltipTrigger render={<span>{menu}</span>} />
          <TooltipContent>
            {locked
              ? "System roles cannot be modified or deleted."
              : "Reassign this role's users before deleting it."}
          </TooltipContent>
        </Tooltip>
      ) : (
        menu
      )}
      <RoleFormDialog
        role={role}
        open={activeDialog === "edit"}
        onOpenChange={(open) => setActiveDialog(open ? "edit" : null)}
      />
      <RolePermissionsDialog
        role={role}
        open={activeDialog === "permissions"}
        onOpenChange={(open) => setActiveDialog(open ? "permissions" : null)}
      />
      <DeleteRoleDialog
        role={role}
        open={activeDialog === "delete"}
        onOpenChange={(open) => setActiveDialog(open ? "delete" : null)}
      />
    </>
  );
}

export function RolesTable() {
  const { data } = useRoles();

  const table = useDataTable({
    columns,
    data: data ?? [],
    getRowId: (row) => String(row.id),
    title: "Roles",
    renderToolbarActions: () => <NewRoleButton />,
    renderRowActions: ({ row }) => <RowActions role={row.original} />,
  });

  return <DataTable table={table} />;
}
