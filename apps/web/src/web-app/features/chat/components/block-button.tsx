"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useBlockUser } from "../hooks/use-block-user";

// Only handles blocking — a thread doesn't tell the client which side
// initiated an existing block, so "unblock" only makes sense from the
// Blocked Users list (see blocked-users-list.tsx), where the current user
// is unambiguously the blocker for every entry shown.
export function BlockButton({
  conversationId,
  otherWebUserId,
}: {
  conversationId: number;
  otherWebUserId: number;
}) {
  const [open, setOpen] = useState(false);
  const blockUser = useBlockUser(conversationId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        Block user
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block this user?</DialogTitle>
          <DialogDescription>
            This makes the conversation read-only for both of you. Message
            history stays visible, but neither of you can send new messages
            until you unblock.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            disabled={blockUser.isPending}
            onClick={() =>
              blockUser.mutate(otherWebUserId, {
                onSuccess: () => setOpen(false),
              })
            }
          >
            {blockUser.isPending ? "Blocking…" : "Block"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
