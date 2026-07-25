"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteUser } from "../hooks/use-users";
import type { AdminUser } from "../types/user.types";

export function DeleteUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteUser = useDeleteUser();

  const onConfirm = () => {
    deleteUser.mutate(user.id, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {user.email}?</DialogTitle>
          <DialogDescription>
            This removes the user&apos;s access immediately. This cannot be
            undone from the UI.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={deleteUser.isPending}
          >
            {deleteUser.isPending ? "Deleting…" : "Delete user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
