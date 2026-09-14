"use client";

import type { Company } from "@careerslk/types";
import { useWebUser } from "@jobboard/providers/web-user-provider";
import { IconBolt } from "@tabler/icons-react";
import { Badge, type badgeVariants } from "@ui/badge";
import { Button } from "@ui/button";
import { Card } from "@ui/card";
import { ConfirmDialog } from "@ui/confirm-dialog";
import type { VariantProps } from "class-variance-authority";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { requestAutoApproval } from "../api/company.actions";

const STATUS: Record<
  Company["autoApprovalStatus"],
  { label: string; badgeVariant: VariantProps<typeof badgeVariants>["variant"] }
> = {
  NONE: { label: "Not requested", badgeVariant: "secondary" },
  REQUESTED: { label: "Pending review", badgeVariant: "warning" },
  GRANTED: { label: "Granted", badgeVariant: "success" },
  DENIED: { label: "Denied", badgeVariant: "destructive" },
};

export function AutoApprovalStatus({
  status,
}: {
  status: Company["autoApprovalStatus"];
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [error, setError] = useState<string | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { openLoginModal } = useWebUser();

  const alreadyHandled =
    currentStatus === "REQUESTED" || currentStatus === "GRANTED";
  const { label, badgeVariant } = STATUS[currentStatus];

  const handleRequest = () => {
    startTransition(async () => {
      const result = await requestAutoApproval();
      if ("requiresAuth" in result) {
        openLoginModal();
        return;
      }
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setCurrentStatus(result.status);
      router.refresh();
    });
  };

  return (
    <Card className="px-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
            <IconBolt className="size-4.5 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">
              Auto-approval for job postings
            </p>
            <p className="text-sm text-muted-foreground">
              Skip manual review and publish your jobs instantly.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={badgeVariant}>{label}</Badge>
          {currentStatus !== "GRANTED" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={alreadyHandled || isPending}
              onClick={() => setConfirmOpen(true)}
            >
              {isPending
                ? "Requesting…"
                : currentStatus === "REQUESTED"
                  ? "Requested"
                  : "Request auto-approval"}
            </Button>
          )}
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Request auto-approval?"
        description="Make sure you've filled in all your company details first. Auto-approval requests are only granted to accounts signed in with a company email address, not a personal email like Gmail."
        confirmLabel="Request auto-approval"
        isPending={isPending}
        onConfirm={handleRequest}
      />
    </Card>
  );
}
