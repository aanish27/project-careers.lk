"use client";

import type { JobWithCompany } from "@careerslk/types";
import {
  removeJobFromProfile,
  withdrawJob,
} from "@web-app-features/auth/api/profile.actions";
import { useWebUser } from "@jobboard/providers/web-user-provider";
import { Badge, badgeVariants } from "@ui/badge";
import { Button, buttonVariants } from "@ui/button";
import { ConfirmDialog } from "@ui/confirm-dialog";
import type { VariantProps } from "class-variance-authority";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export const STATUS_VARIANT: Record<
  JobWithCompany["approvalStatus"],
  BadgeVariant
> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

export const STATUS_LABEL: Record<JobWithCompany["approvalStatus"], string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

type ConfirmTarget = { jobId: number; action: "withdraw" | "delete" };

export function MyJobsList({ jobs }: { jobs: JobWithCompany[] }) {
  const [items, setItems] = useState(jobs);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(
    null,
  );
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
        setItems((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? { ...job, deletedAt: new Date().toISOString() }
              : job,
          ),
        );
      }
    });
  };

  const handleDelete = (jobId: number) => {
    setPendingId(jobId);
    startTransition(async () => {
      const result = await removeJobFromProfile(jobId);
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
    <>
      <ul className="flex flex-col gap-3">
        {items.map((job) => {
          const isWithdrawn = job.deletedAt !== null;
          return (
            <li key={job.id} className="rounded-md border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {job.company.name}
                  </p>
                </div>
                {isWithdrawn ? (
                  <Badge variant="outline">Withdrawn</Badge>
                ) : (
                  <Badge
                    variant={STATUS_VARIANT[job.approvalStatus] ?? "outline"}
                  >
                    {STATUS_LABEL[job.approvalStatus] ?? job.approvalStatus}
                  </Badge>
                )}
              </div>
              {!isWithdrawn &&
                job.approvalStatus === "REJECTED" &&
                job.rejectionReason && (
                  <p className="mt-2 text-sm text-destructive">
                    {job.rejectionReason}
                  </p>
                )}
              <div className="mt-3 flex items-center gap-2">
                {!isWithdrawn && job.approvalStatus === "APPROVED" && (
                  <Link
                    href={`/job/${job.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    View job <ExternalLink className="size-3.5" />
                  </Link>
                )}
                {isWithdrawn ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pendingId === job.id}
                    onClick={() =>
                      setConfirmTarget({ jobId: job.id, action: "delete" })
                    }
                  >
                    {pendingId === job.id ? "Deleting…" : "Delete"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pendingId === job.id}
                    onClick={() =>
                      setConfirmTarget({ jobId: job.id, action: "withdraw" })
                    }
                  >
                    {pendingId === job.id ? "Withdrawing…" : "Withdraw"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title={
          confirmTarget?.action === "delete"
            ? "Delete this job posting?"
            : "Withdraw this job posting?"
        }
        description={
          confirmTarget?.action === "delete"
            ? "This removes it from your job postings list for good. This can't be undone."
            : "It will no longer be visible to applicants and will be removed from anyone's saved jobs. You can still see it here afterward, marked as withdrawn."
        }
        confirmLabel={
          confirmTarget?.action === "delete" ? "Delete" : "Withdraw"
        }
        variant="destructive"
        isPending={pendingId === confirmTarget?.jobId}
        onConfirm={() => {
          if (!confirmTarget) return;
          if (confirmTarget.action === "delete") {
            handleDelete(confirmTarget.jobId);
          } else {
            handleWithdraw(confirmTarget.jobId);
          }
        }}
      />
    </>
  );
}
