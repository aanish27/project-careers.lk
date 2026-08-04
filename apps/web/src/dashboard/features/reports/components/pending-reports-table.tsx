"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AbuseReportWithReporter } from "@careerslk/types";
import { IconCheck, IconX } from "@tabler/icons-react";
import { DataTable, useDataTable } from "@ui/data-table";
import { useReports } from "../hooks/use-reports";
import { pendingColumns } from "./pending-columns";
import { ResolveReportDialog } from "./resolve-report-dialog";

function RowActions({ report }: { report: AbuseReportWithReporter }) {
  const [dialogAction, setDialogAction] = useState<"review" | "dismiss" | null>(
    null,
  );

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="default"
              size="icon-xs"
              aria-label="Mark reviewed"
              onClick={() => setDialogAction("review")}
            >
              <IconCheck />
            </Button>
          }
        />
        <TooltipContent>Mark reviewed</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="destructive"
              size="icon-xs"
              aria-label="Dismiss"
              onClick={() => setDialogAction("dismiss")}
            >
              <IconX />
            </Button>
          }
        />
        <TooltipContent>Dismiss</TooltipContent>
      </Tooltip>
      {dialogAction && (
        <ResolveReportDialog
          report={report}
          action={dialogAction}
          open={!!dialogAction}
          onOpenChange={(open) => !open && setDialogAction(null)}
        />
      )}
    </>
  );
}

export function PendingReportsTable() {
  const { data } = useReports({ status: "PENDING" });

  const table = useDataTable({
    columns: pendingColumns,
    data: data ?? [],
    getRowId: (row) => String(row.id),
    title: "Pending reports",
    renderRowActions: ({ row }) => <RowActions report={row.original} />,
  });

  return <DataTable table={table} />;
}
