"use client";

import type { Company } from "@careerslk/types";
import { useWebUser } from "@jobboard/providers/web-user-provider";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { requestAutoApproval } from "../api/company.actions";

const STATUS_LABELS: Record<Company["autoApprovalStatus"], string> = {
  NONE: "Not requested",
  REQUESTED: "Requested — pending review",
  GRANTED: "Granted",
  DENIED: "Denied",
};

export function AutoApprovalStatus({
  status,
}: {
  status: Company["autoApprovalStatus"];
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { openLoginModal } = useWebUser();

  const alreadyHandled =
    currentStatus === "REQUESTED" || currentStatus === "GRANTED";

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
    <div className="flex flex-wrap items-center gap-3">
      <div>
        <p className="text-sm font-medium">Auto-approval for job postings</p>
        <Badge variant="secondary">{STATUS_LABELS[currentStatus]}</Badge>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={alreadyHandled || isPending}
        onClick={handleRequest}
      >
        {isPending
          ? "Requesting…"
          : currentStatus === "GRANTED"
            ? "Granted"
            : currentStatus === "REQUESTED"
              ? "Requested"
              : "Request auto-approval"}
      </Button>
    </div>
  );
}
