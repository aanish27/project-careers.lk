"use client";

import type { JobWithCompany } from "@careerslk/types";
import { withdrawJob } from "@web-app-features/auth/api/profile.actions";
import { useWebUser } from "@jobboard/providers/web-user-provider";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import { useState, useTransition } from "react";

const STATUS_VARIANT: Record<
  JobWithCompany["approvalStatus"],
  "default" | "outline" | "destructive"
> = {
  PENDING: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
};

const STATUS_LABEL: Record<JobWithCompany["approvalStatus"], string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function MyJobsList({ jobs }: { jobs: JobWithCompany[] }) {
  const [items, setItems] = useState(jobs);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const { openLoginModal } = useWebUser();

  const handleWithdraw = (jobId: number) => {
    setPendingId(jobId);
    startTransition(async () => {
      const result = await withdrawJob(jobId);
      setPendingId(null);
      if ("requiresAuth" in result) {
        openLoginModal();
        return;
      }
      if ("ok" in result) {
        setItems((prev) => prev.filter((job) => job.id !== jobId));
      }
    });
  };

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You haven&apos;t posted any jobs yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((job) => (
        <li key={job.id} className="rounded-md border border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{job.title}</p>
              <p className="text-sm text-muted-foreground">
                {job.company.name}
              </p>
            </div>
            <Badge variant={STATUS_VARIANT[job.approvalStatus]}>
              {STATUS_LABEL[job.approvalStatus]}
            </Badge>
          </div>
          {job.approvalStatus === "REJECTED" && job.rejectionReason && (
            <p className="mt-2 text-sm text-destructive">
              {job.rejectionReason}
            </p>
          )}
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pendingId === job.id}
              onClick={() => handleWithdraw(job.id)}
            >
              {pendingId === job.id ? "Withdrawing…" : "Withdraw"}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
