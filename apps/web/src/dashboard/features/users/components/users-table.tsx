"use client";

import { useState } from "react";
import { PERMISSIONS } from "@careerslk/lib";
import { DataTable, useDataTable } from "@ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Can } from "@dashboard-components/can";
import { useAuth } from "@dashboard-hooks/use-auth";
import { AssignRolesDialog } from "./assign-roles-dialog";
import { BlockUserDialog } from "./block-user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { columns } from "./columns";
import { useUsers } from "../hooks/use-users";
import { NewUserButton } from "./new-user-button";
import type { AdminUser } from "@careerslk/types";

type ActiveDialog = "assignRoles" | "resetPassword" | "block" | "delete" | null;

// Dialogs are rendered as siblings of the DropdownMenu, not nested inside it.
// Nesting a Dialog trigger inside a DropdownMenuItem races the menu's own
// close (which unmounts/removes focus) against the dialog's open — the
// dialog would flash open and immediately close. Controlling `open` from
// here and rendering the Dialog components outside DropdownMenuContent
// avoids that entirely.
function RowActions({ user }: { user: AdminUser }) {
  const { user: actor } = useAuth();
  const isSelf = actor.id === user.id;
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" disabled={isSelf}>
            Actions
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <Can permission={PERMISSIONS.USERS_ROLES_ASSIGN}>
          <DropdownMenuItem onClick={() => setActiveDialog("assignRoles")}>
            Assign roles
          </DropdownMenuItem>
        </Can>
        <Can permission={PERMISSIONS.USERS_PASSWORD_RESET}>
          <DropdownMenuItem onClick={() => setActiveDialog("resetPassword")}>
            Reset password
          </DropdownMenuItem>
        </Can>
        <Can permission={PERMISSIONS.USERS_UPDATE}>
          <DropdownMenuItem onClick={() => setActiveDialog("block")}>
            {user.isActive ? "Block" : "Unblock"}
          </DropdownMenuItem>
        </Can>
        <Can permission={PERMISSIONS.USERS_DELETE}>
          <DropdownMenuItem
            variant="destructive"
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
      {isSelf ? (
        <Tooltip>
          <TooltipTrigger render={<span>{menu}</span>} />
          <TooltipContent>
            You cannot modify your own account here.
          </TooltipContent>
        </Tooltip>
      ) : (
        menu
      )}
      <AssignRolesDialog
        user={user}
        open={activeDialog === "assignRoles"}
        onOpenChange={(open) => setActiveDialog(open ? "assignRoles" : null)}
      />
      <ResetPasswordDialog
        user={user}
        open={activeDialog === "resetPassword"}
        onOpenChange={(open) => setActiveDialog(open ? "resetPassword" : null)}
      />
      <BlockUserDialog
        user={user}
        open={activeDialog === "block"}
        onOpenChange={(open) => setActiveDialog(open ? "block" : null)}
      />
      <DeleteUserDialog
        user={user}
        open={activeDialog === "delete"}
        onOpenChange={(open) => setActiveDialog(open ? "delete" : null)}
      />
    </>
  );
}

export function UsersTable() {
  const { data } = useUsers();

  const table = useDataTable({
    columns,
    data: data ?? [],
    getRowId: (row) => String(row.id),
    title: "Users",
    renderToolbarActions: () => <NewUserButton />,
    renderRowActions: ({ row }) => <RowActions user={row.original} />,
  });

  return <DataTable table={table} />;
}
