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
import type { FreelanceProfileWithWebUser } from "../api/api";
import { useRejectFreelanceProfile } from "../hooks/use-reject-freelance-profile";

export function RejectFreelanceProfileDialog({
  profile,
  open,
  onOpenChange,
}: {
  profile: FreelanceProfileWithWebUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const rejectProfile = useRejectFreelanceProfile();

  const reset = () => {
    setReason("");
    setInternalNotes("");
  };

  const onConfirm = () => {
    rejectProfile.mutate(
      {
        id: profile.id,
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
          <DialogTitle>Reject freelance profile?</DialogTitle>
          <DialogDescription>
            {profile.webUser.firstName ?? profile.webUser.email} will only see
            the first field below — the second is for admins only.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reject-reason">Reason shown to user</Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why this profile was rejected"
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
            disabled={rejectProfile.isPending}
            onClick={onConfirm}
          >
            {rejectProfile.isPending ? "Rejecting…" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
