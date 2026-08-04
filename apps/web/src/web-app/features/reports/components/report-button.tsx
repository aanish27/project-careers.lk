"use client";

import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@jobboard/hooks/use-require-auth";
import type { AbuseReportEntityType } from "@careerslk/types";
import { IconFlag } from "@tabler/icons-react";
import { useState } from "react";
import { ReportDialog } from "./report-dialog";

export function ReportButton({
  entityType,
  entityId,
  label = "Report",
}: {
  entityType: AbuseReportEntityType;
  entityId: number;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const requireAuth = useRequireAuth();

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => requireAuth(() => setOpen(true))}
      >
        <IconFlag className="size-4" />
        {label}
      </Button>
      <ReportDialog
        entityType={entityType}
        entityId={entityId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
