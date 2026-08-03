"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconBriefcase,
  IconBuildingSkyscraper,
  IconMapPin,
} from "@tabler/icons-react";

type JobFilterBarProps = {
  title: string;
  resultCount: number;
  location: string;
  onLocationChange: (value: string) => void;
  workMode: string;
  onWorkModeChange: (value: string) => void;
  employmentType: string;
  onEmploymentTypeChange: (value: string) => void;
};

const JobFilterBar = ({
  title,
  resultCount,
  location,
  onLocationChange,
  workMode,
  onWorkModeChange,
  employmentType,
  onEmploymentTypeChange,
}: JobFilterBarProps) => {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
      <h2 className="text-xl font-bold text-foreground">
        {title}{" "}
        <span className="text-xs font-normal text-muted-foreground">
          ({resultCount})
        </span>
      </h2>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2">
          <IconMapPin className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="Location"
            className="w-36 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <Select
          value={workMode}
          onValueChange={(value) => onWorkModeChange(value ?? "all")}
        >
          <SelectTrigger className="gap-2 rounded-full border-border bg-white px-4">
            <IconBuildingSkyscraper className="size-4 text-muted-foreground" />
            <SelectValue placeholder="Work Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Work Modes</SelectItem>
            <SelectItem value="On-Site">On-Site</SelectItem>
            <SelectItem value="Remote">Remote</SelectItem>
            <SelectItem value="Hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={employmentType}
          onValueChange={(value) => onEmploymentTypeChange(value ?? "all")}
        >
          <SelectTrigger className="gap-2 rounded-full border-border bg-white px-4">
            <IconBriefcase className="size-4 text-muted-foreground" />
            <SelectValue placeholder="Employment Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="full-time">Full-Time</SelectItem>
            <SelectItem value="part-time">Part-Time</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="internship">Internship</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default JobFilterBar;
