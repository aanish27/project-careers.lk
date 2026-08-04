"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconCheck, IconX } from "@tabler/icons-react";
import { DataTable, useDataTable } from "@ui/data-table";
import type { FreelanceProfileWithWebUser } from "../api/api";
import { useApproveFreelanceProfile } from "../hooks/use-approve-freelance-profile";
import { useFreelanceProfiles } from "../hooks/use-freelance-profiles";
import { pendingColumns } from "./pending-columns";
import { RejectFreelanceProfileDialog } from "./reject-dialog";

function RowActions({ profile }: { profile: FreelanceProfileWithWebUser }) {
  const approveProfile = useApproveFreelanceProfile();
  const [rejectOpen, setRejectOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="default"
              size="icon-xs"
              aria-label="Approve"
              disabled={approveProfile.isPending}
              onClick={() => approveProfile.mutate(profile.id)}
            >
              <IconCheck />
            </Button>
          }
        />
        <TooltipContent>Approve</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="destructive"
              size="icon-xs"
              aria-label="Reject"
              onClick={() => setRejectOpen(true)}
            >
              <IconX />
            </Button>
          }
        />
        <TooltipContent>Reject</TooltipContent>
      </Tooltip>
      <RejectFreelanceProfileDialog
        profile={profile}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
      />
    </>
  );
}

export function PendingFreelanceProfilesTable() {
  const { data } = useFreelanceProfiles({ approvalStatus: "PENDING" });

  const table = useDataTable({
    columns: pendingColumns,
    data: data ?? [],
    getRowId: (row) => String(row.id),
    title: "Pending freelance profiles",
    renderRowActions: ({ row }) => <RowActions profile={row.original} />,
  });

  return <DataTable table={table} />;
}
