"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Company } from "@careerslk/types";
import { PERMISSIONS } from "@careerslk/lib";
import { Can } from "@dashboard-components/can";
import {
  IconBriefcase,
  IconDots,
  IconEye,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import { DataTable, useDataTable } from "@ui/data-table";
import Link from "next/link";
import { useCompanies } from "../hooks/use-companies";
import { BulkScrapeToolbar } from "./bulk-scrape-toolbar";
import { columns } from "./columns";
import { CompanyFormDialog } from "./company-form-dialog";
import { DeleteCompanyDialog } from "./delete-company-dialog";
import { ScrapeCompanyButton } from "./scrape-company-button";
import { ScrapeJobButton } from "./scrape-job-button";

type ActiveDialog = "edit" | "delete" | null;

// Dialogs are rendered as siblings of the DropdownMenu, not nested inside it.
// Nesting a Dialog trigger inside a DropdownMenuItem races the menu's own
// close (which unmounts/removes focus) against the dialog's open — the
// dialog would flash open and immediately close. Controlling `open` from
// here and rendering the Dialog components outside DropdownMenuContent
// avoids that entirely.
function RowActions({ company }: { company: Company }) {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="info"
              size="icon-xs"
              aria-label="View detail"
              render={<Link href={`/admin/company/${company.id}`}></Link>}
              nativeButton={false}
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
              variant="info"
              size="icon-xs"
              aria-label="View jobs"
              render={<Link href={`/admin/company/${company.id}/jobs`}></Link>}
              nativeButton={false}
            >
              <IconBriefcase />
            </Button>
          }
        />
        <TooltipContent>View jobs</TooltipContent>
      </Tooltip>
      <ScrapeJobButton companyId={company.id} />
      <ScrapeCompanyButton companyId={company.id} />
      <Can anyOf={[PERMISSIONS.COMPANIES_UPDATE, PERMISSIONS.COMPANIES_DELETE]}>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon-xs"
                aria-label="More actions"
              >
                <IconDots />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <Can permission={PERMISSIONS.COMPANIES_UPDATE}>
              <DropdownMenuItem onClick={() => setActiveDialog("edit")}>
                <IconPencil className="text-warning mr-2 size-3.5" />
                Edit
              </DropdownMenuItem>
            </Can>
            <Can permission={PERMISSIONS.COMPANIES_DELETE}>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setActiveDialog("delete")}
              >
                <IconTrash className="mr-2 size-3.5" />
                Delete
              </DropdownMenuItem>
            </Can>
          </DropdownMenuContent>
        </DropdownMenu>
      </Can>
      <CompanyFormDialog
        company={company}
        open={activeDialog === "edit"}
        onOpenChange={(open) => setActiveDialog(open ? "edit" : null)}
      />
      <DeleteCompanyDialog
        company={company}
        open={activeDialog === "delete"}
        onOpenChange={(open) => setActiveDialog(open ? "delete" : null)}
      />
    </>
  );
}

export function CompanyTable() {
  const { data } = useCompanies();

  const table = useDataTable({
    columns,
    data: data ?? [],
    getRowId: (row) => String(row.id),
    enableRowSelection: true,
    renderRowActions: ({ row }) => <RowActions company={row.original} />,
    renderToolbarActions: ({ table }) => {
      const selected = table.getSelectedRowModel().rows;

      if (selected.length > 0) {
        return (
          <BulkScrapeToolbar
            companyIds={selected.map((row) => row.original.id)}
          />
        );
      }

      return (
        <Can permission={PERMISSIONS.COMPANIES_CREATE}>
          <CompanyFormDialog>
            <Button>Add company</Button>
          </CompanyFormDialog>
        </Can>
      );
    },
  });

  return <DataTable table={table} />;
}
