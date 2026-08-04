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
import { Textarea } from "@/components/ui/textarea";
import type { JobWithCompany } from "@careerslk/types";
import { useRejectJob } from "../hooks/use-reject-job";

export function RejectJobDialog({
  job,
  open,
  onOpenChange,
}: {
  job: JobWithCompany;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const rejectJob = useRejectJob();

  const onConfirm = () => {
    rejectJob.mutate(
      { id: job.id, reason: reason.trim() },
      {
        onSuccess: () => {
          setReason("");
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject {job.title}?</DialogTitle>
          <DialogDescription>
            Tell {job.company.name} why this job posting was rejected.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection"
        />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            disabled={rejectJob.isPending || reason.trim().length === 0}
            onClick={onConfirm}
          >
            {rejectJob.isPending ? "Rejecting…" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
