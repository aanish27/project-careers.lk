"use client";

import type { RowData } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@utils/utils";

import type { DataTableInstance } from "../../../core/types";

/** Funnel toggle that shows/hides the filter row. */
export function DataTableFilterToggle<TData extends RowData>({
  table,
}: {
  table: DataTableInstance<TData>;
}) {
  const { localization, icons, showColumnFilters, setShowColumnFilters } =
    table.tableInstance;
  const label = showColumnFilters
    ? localization.hideColumnFilters
    : localization.showColumnFilters;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label={label}
            aria-pressed={showColumnFilters}
            onClick={() => setShowColumnFilters((prev) => !prev)}
            className={cn(
              "size-8",
              showColumnFilters && "bg-muted text-foreground",
            )}
          />
        }
      >
        <icons.filter />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
