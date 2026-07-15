"use client";

import type { RowData } from "@tanstack/react-table";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@utils/utils";

import { getColumnLabel } from "../../../helpers/column-label";
import {
  CALENDAR_NAV_PROPS,
  FIELD_CLASS,
  type FilterFieldProps,
} from "./shared";

export function DateRangeFilterField<TData extends RowData, TValue>({
  column,
  table,
}: FilterFieldProps<TData, TValue>) {
  const { localization, icons } = table.tableInstance;
  const value = (column.getFilterValue() as [Date?, Date?]) ?? [
    undefined,
    undefined,
  ];
  const from = value[0];
  const to = value[1];
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              FIELD_CLASS,
              "w-full justify-start gap-2 px-2 font-normal",
            )}
            aria-label={localization.filterByColumn(getColumnLabel(column))}
          />
        }
      >
        <icons.calendar className="text-muted-foreground" />
        {from || to ? (
          <span className="truncate">
            {from ? format(from, "PP") : "…"} – {to ? format(to, "PP") : "…"}
          </span>
        ) : (
          <span className="truncate text-muted-foreground">
            {localization.pickDateRange}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{ from, to }}
          onSelect={(range) =>
            column.setFilterValue(
              range?.from || range?.to ? [range?.from, range?.to] : undefined,
            )
          }
          autoFocus
          {...CALENDAR_NAV_PROPS}
        />
      </PopoverContent>
    </Popover>
  );
}
