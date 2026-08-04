"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { GigWithWebUser } from "../api/api";
import { useRejectGig } from "../hooks/use-reject-gig";

export function RejectGigDialog({
  gig,
  open,
  onOpenChange,
}: {
  gig: GigWithWebUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const rejectGig = useRejectGig();

  const reset = () => {
    setReason("");
    setInternalNotes("");
  };

  const onConfirm = () => {
    rejectGig.mutate(
      {
        id: gig.id,
        dto: {
          reason: reason.trim() || undefined,
          internalNotes: internalNotes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject {gig.title}?</DialogTitle>
          <DialogDescription>
            {gig.postedBy.firstName ?? gig.postedBy.email} will only see the
            first field below — the second is for admins only.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reject-reason">Reason shown to user</Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why this gig was rejected"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reject-internal-notes">
            Internal note (admins only, not visible to the submitter)
          </Label>
          <Textarea
            id="reject-internal-notes"
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Notes for other reviewers"
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            disabled={rejectGig.isPending}
            onClick={onConfirm}
          >
            {rejectGig.isPending ? "Rejecting…" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
