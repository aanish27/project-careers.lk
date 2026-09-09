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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  AbuseReportCategory,
  AbuseReportEntityType,
} from "@careerslk/types";
import { dismissRateLimited } from "@lib/messages";
import { useState } from "react";
import { useFileReport } from "../hooks/use-file-report";

const CATEGORY_OPTIONS: { value: AbuseReportCategory; label: string }[] = [
  { value: "SPAM", label: "Spam" },
  { value: "SCAM_FRAUD", label: "Scam or fraud" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate content" },
  { value: "OTHER", label: "Other" },
];

export function ReportDialog({
  entityType,
  entityId,
  open,
  onOpenChange,
}: {
  entityType: AbuseReportEntityType;
  entityId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [category, setCategory] = useState<AbuseReportCategory>(
    CATEGORY_OPTIONS[0]!.value,
  );
  const [details, setDetails] = useState("");
  const fileReport = useFileReport();

  const reset = () => {
    setCategory(CATEGORY_OPTIONS[0]!.value);
    setDetails("");
    fileReport.reset();
  };

  const onSubmit = () => {
    fileReport.mutate(
      {
        entityType,
        entityId,
        category,
        details: details.trim() || undefined,
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
          <DialogTitle>Report this content</DialogTitle>
          <DialogDescription>
            Let us know what&apos;s wrong — an admin will review it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="report-category">Category</Label>
          <select
            id="report-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as AbuseReportCategory)}
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="report-details">Details (optional)</Label>
          <Textarea
            id="report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Anything else admins should know"
          />
        </div>
        {fileReport.isError && dismissRateLimited(fileReport.error.message) && (
          <p className="text-destructive text-sm">
            {dismissRateLimited(fileReport.error.message)}
          </p>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button disabled={fileReport.isPending} onClick={onSubmit}>
            {fileReport.isPending ? "Submitting…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
