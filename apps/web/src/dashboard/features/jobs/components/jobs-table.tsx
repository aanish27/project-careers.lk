"use client";

import { DataTable, useDataTable } from "@ui/data-table";
import { useJobs } from "../hooks/use-jobs";
import { columns } from "./columns";

// Dialogs are rendered as siblings of the DropdownMenu, not nested inside it.
// Nesting a Dialog trigger inside a DropdownMenuItem races the menu's own
// close (which unmounts/removes focus) against the dialog's open — the
// dialog would flash open and immediately close. Controlling `open` from
// here and rendering the Dialog components outside DropdownMenuContent
// avoids that entirely.
// function RowActions({ user }: { user: AdminUser }) {
//   const { user: actor } = useAuth();
//   const isSelf = actor.id === user.id;
//   const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

//   const menu = (
//     <DropdownMenu>
//       <DropdownMenuTrigger
//         render={
//           <Button variant="ghost" size="sm" disabled={isSelf}>
//             Actions
//           </Button>
//         }
//       />
//       <DropdownMenuContent align="end">
//         <Can permission={PERMISSIONS.USERS_ROLES_ASSIGN}>
//           <DropdownMenuItem onClick={() => setActiveDialog("assignRoles")}>
//             Assign roles
//           </DropdownMenuItem>
//         </Can>
//         <Can permission={PERMISSIONS.USERS_PASSWORD_RESET}>
//           <DropdownMenuItem onClick={() => setActiveDialog("resetPassword")}>
//             Reset password
//           </DropdownMenuItem>
//         </Can>
//         <Can permission={PERMISSIONS.USERS_UPDATE}>
//           <DropdownMenuItem onClick={() => setActiveDialog("block")}>
//             {user.isActive ? "Block" : "Unblock"}
//           </DropdownMenuItem>
//         </Can>
//         <Can permission={PERMISSIONS.USERS_DELETE}>
//           <DropdownMenuItem
//             variant="destructive"
//             onClick={() => setActiveDialog("delete")}
//           >
//             Delete
//           </DropdownMenuItem>
//         </Can>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );

//   return (
//     <>
//       {isSelf ? (
//         <Tooltip>
//           <TooltipTrigger render={<span>{menu}</span>} />
//           <TooltipContent>
//             You cannot modify your own account here.
//           </TooltipContent>
//         </Tooltip>
//       ) : (
//         menu
//       )}
//       <AssignRolesDialog
//         user={user}
//         open={activeDialog === "assignRoles"}
//         onOpenChange={(open) => setActiveDialog(open ? "assignRoles" : null)}
//       />
//       <ResetPasswordDialog
//         user={user}
//         open={activeDialog === "resetPassword"}
//         onOpenChange={(open) => setActiveDialog(open ? "resetPassword" : null)}
//       />
//       <BlockUserDialog
//         user={user}
//         open={activeDialog === "block"}
//         onOpenChange={(open) => setActiveDialog(open ? "block" : null)}
//       />
//       <DeleteUserDialog
//         user={user}
//         open={activeDialog === "delete"}
//         onOpenChange={(open) => setActiveDialog(open ? "delete" : null)}
//       />
//     </>
//   );
// }

export function JobsTable({ companyId }: { companyId?: number } = {}) {
  const { data } = useJobs(companyId ? { companyId } : undefined);

  const table = useDataTable({
    columns,
    data: data ?? [],
    getRowId: (row) => String(row.id),
    title: "Jobs",
    enableColumnResizing: true,
    enableGrouping: true,

    // renderToolbarActions: () => <NewUserButton />,
    // renderRowActions: ({ row }) => <RowActions user={row.original} />,
  });

  return <DataTable table={table} />;
}
