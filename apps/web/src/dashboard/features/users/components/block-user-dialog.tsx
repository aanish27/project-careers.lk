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
import { useUpdateUserProfile } from "../hooks/use-users";
import type { AdminUser } from "@careerslk/types";

export function BlockUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateProfile = useUpdateUserProfile();
  const willBlock = user.isActive;

  const onConfirm = () => {
    updateProfile.mutate(
      { id: user.id, body: { isActive: !user.isActive } },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {willBlock ? "Block" : "Unblock"} {user.email}?
          </DialogTitle>
          <DialogDescription>
            {willBlock
              ? "They will be signed out and unable to log in until reactivated."
              : "They will be able to log in again."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant={willBlock ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={updateProfile.isPending}
          >
            {willBlock ? "Block user" : "Unblock user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
