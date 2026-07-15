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

import { VALUELESS_MODES } from "../../../fns/filter-fns";
import { getColumnLabel } from "../../../helpers/column-label";
import { getEffectiveMode } from "../../../helpers/effective-filter-mode";
import { DateRangeFilterField } from "./date-range";
import {
  CALENDAR_NAV_PROPS,
  FIELD_CLASS,
  ValuelessLabel,
  type FilterFieldProps,
} from "./shared";

export function DateFilterField<TData extends RowData, TValue>({
  column,
  table,
}: FilterFieldProps<TData, TValue>) {
  const { localization, icons } = table.tableInstance;
  const mode = getEffectiveMode(column, table);

  if (VALUELESS_MODES.has(mode)) {
    return <ValuelessLabel label={localization.filterModes[mode] ?? mode} />;
  }

  // The `betweenDates` mode (and the date-range variant) selects a range.
  if (mode === "betweenDates") {
    return <DateRangeFilterField column={column} table={table} />;
  }

  const value = column.getFilterValue() as Date | undefined;
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
        {value ? (
          <span className="truncate">{format(value, "PP")}</span>
        ) : (
          <span className="truncate text-muted-foreground">
            {localization.pickDate}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => column.setFilterValue(date ?? undefined)}
          autoFocus
          {...CALENDAR_NAV_PROPS}
        />
      </PopoverContent>
    </Popover>
  );
}
