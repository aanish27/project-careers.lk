"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IconCoin } from "@tabler/icons-react";
import { useState } from "react";

type SalaryRangeFilterProps = {
  salaryMin?: number;
  salaryMax?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
};

const SalaryRangeFilter = ({
  salaryMin,
  salaryMax,
  onChange,
}: SalaryRangeFilterProps) => {
  const [min, setMin] = useState(salaryMin?.toString() ?? "");
  const [max, setMax] = useState(salaryMax?.toString() ?? "");

  const apply = () => {
    onChange(
      min.trim() ? Number(min) : undefined,
      max.trim() ? Number(max) : undefined,
    );
  };

  const label =
    salaryMin || salaryMax
      ? `${salaryMin ? salaryMin.toLocaleString() : "0"} - ${
          salaryMax ? salaryMax.toLocaleString() : "any"
        }`
      : "Salary";

  return (
    <Popover>
      <PopoverTrigger className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground">
        <IconCoin className="size-4 shrink-0 text-muted-foreground" />
        {label}
      </PopoverTrigger>
      <PopoverContent className="flex w-56 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Min salary
          </label>
          <input
            type="number"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            onBlur={apply}
            className="rounded-md border border-border px-2 py-1 text-sm outline-none"
            placeholder="e.g. 50000"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Max salary
          </label>
          <input
            type="number"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            onBlur={apply}
            className="rounded-md border border-border px-2 py-1 text-sm outline-none"
            placeholder="e.g. 200000"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SalaryRangeFilter;
