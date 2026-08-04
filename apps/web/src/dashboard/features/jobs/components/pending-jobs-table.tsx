"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { JobWithCompany } from "@careerslk/types";
import { IconCheck, IconEye, IconX } from "@tabler/icons-react";
import { DataTable, useDataTable } from "@ui/data-table";
import Link from "next/link";
import { useApproveJob } from "../hooks/use-approve-job";
import { useJobs } from "../hooks/use-jobs";
import { pendingColumns } from "./pending-columns";
import { RejectJobDialog } from "./reject-job-dialog";

function RowActions({ job }: { job: JobWithCompany }) {
  const approveJob = useApproveJob();
  const [rejectOpen, setRejectOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon-xs"
              aria-label="View detail"
              render={<Link href={`/admin/jobs/${job.id}`}></Link>}
            >
              <IconEye />
            </Button>
          }
        />
        <TooltipContent>View detail</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="default"
              size="icon-xs"
              aria-label="Approve"
              disabled={approveJob.isPending}
              onClick={() => approveJob.mutate(job.id)}
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
      <RejectJobDialog
        job={job}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
      />
    </>
  );
}

export function PendingJobsTable() {
  const { data } = useJobs({ approvalStatus: "PENDING" });

  const table = useDataTable({
    columns: pendingColumns,
    data: data ?? [],
    getRowId: (row) => String(row.id),
    title: "Pending jobs",
    renderRowActions: ({ row }) => <RowActions job={row.original} />,
  });

  return <DataTable table={table} />;
}
