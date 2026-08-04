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
import type { GigWithWebUser } from "../api/api";
import { useApproveGig } from "../hooks/use-approve-gig";
import { useGigs } from "../hooks/use-gigs";
import { pendingColumns } from "./pending-columns";
import { RejectGigDialog } from "./reject-dialog";

function RowActions({ gig }: { gig: GigWithWebUser }) {
  const approveGig = useApproveGig();
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
              disabled={approveGig.isPending}
              onClick={() => approveGig.mutate(gig.id)}
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
      <RejectGigDialog
        gig={gig}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
      />
    </>
  );
}

export function PendingGigsTable() {
  const { data } = useGigs({ approvalStatus: "PENDING" });

  const table = useDataTable({
    columns: pendingColumns,
    data: data ?? [],
    getRowId: (row) => String(row.id),
    title: "Pending gigs",
    renderRowActions: ({ row }) => <RowActions gig={row.original} />,
  });

  return <DataTable table={table} />;
}
