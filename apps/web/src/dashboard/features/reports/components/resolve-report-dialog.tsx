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
import type { AbuseReportWithReporter } from "@careerslk/types";
import { useDismissReport } from "../hooks/use-dismiss-report";
import { useReviewReport } from "../hooks/use-review-report";

export function ResolveReportDialog({
  report,
  action,
  open,
  onOpenChange,
}: {
  report: AbuseReportWithReporter;
  action: "review" | "dismiss";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [resolutionNotes, setResolutionNotes] = useState("");
  const reviewReport = useReviewReport();
  const dismissReport = useDismissReport();
  const mutation = action === "review" ? reviewReport : dismissReport;

  const onConfirm = () => {
    mutation.mutate(
      {
        id: report.id,
        dto: { resolutionNotes: resolutionNotes.trim() || undefined },
      },
      {
        onSuccess: () => {
          setResolutionNotes("");
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setResolutionNotes("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === "review"
              ? "Mark report as reviewed?"
              : "Dismiss report?"}
          </DialogTitle>
          <DialogDescription>
            Optional notes for other admins — not shown to the reporter.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={resolutionNotes}
          onChange={(e) => setResolutionNotes(e.target.value)}
          placeholder="Resolution notes"
        />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            variant={action === "dismiss" ? "outline" : "default"}
            disabled={mutation.isPending}
            onClick={onConfirm}
          >
            {mutation.isPending
              ? "Saving…"
              : action === "review"
                ? "Mark Reviewed"
                : "Dismiss"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
