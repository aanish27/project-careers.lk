"use client";

import type { RowData } from "@tanstack/react-table";

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

import type { DataTableInstance } from "../../core/types";
import { exportToCsv, exportToExcel } from "../../utils/export-utils";

/**
 * Toolbar export menu (CSV / Excel). Exports the selected rows when any are
 * selected, otherwise the full filtered set across all pages.
 */
export function DataTableExportMenu<TData extends RowData>({
  table,
  fileName,
}: {
  table: DataTableInstance<TData>;
  fileName?: string;
}) {
  const { localization, icons } = table.tableInstance;
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={localization.export}
                  className="size-8"
                />
              }
            />
          }
        >
          <icons.export />
        </TooltipTrigger>
        <TooltipContent>{localization.export}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => void exportToCsv(table, { fileName })}>
          <icons.fileCsv />
          {localization.exportCsv}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => void exportToExcel(table, { fileName })}
        >
          <icons.fileExcel />
          {localization.exportExcel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
