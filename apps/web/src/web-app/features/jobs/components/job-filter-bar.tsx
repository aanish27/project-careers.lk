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
import SalaryRangeFilter from "./salary-range-filter";
import SkillsFilter from "./skills-filter";

type JobFilterBarProps = {
  resultCount: number;
  location: string;
  onLocationChange: (value: string) => void;
  workMode: string;
  onWorkModeChange: (value: string) => void;
  employmentType: string;
  onEmploymentTypeChange: (value: string) => void;
  salaryMin?: number;
  salaryMax?: number;
  onSalaryChange: (min: number | undefined, max: number | undefined) => void;
  skills: string[];
  onSkillsChange: (skills: string[]) => void;
};

const JobFilterBar = ({
  resultCount,
  location,
  onLocationChange,
  workMode,
  onWorkModeChange,
  employmentType,
  onEmploymentTypeChange,
  salaryMin,
  salaryMax,
  onSalaryChange,
  skills,
  onSkillsChange,
}: JobFilterBarProps) => {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
      <h2 className="text-xl font-bold text-foreground">
        Jobs{" "}
        <span className="text-xs font-normal text-muted-foreground">
          ({resultCount})
        </span>
      </h2>

      <div className="flex flex-wrap items-center gap-3">
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
            <SelectItem value="onsite">On-Site</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
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
            <SelectItem value="full_time">Full-Time</SelectItem>
            <SelectItem value="part_time">Part-Time</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="internship">Internship</SelectItem>
            <SelectItem value="freelance">Freelance</SelectItem>
          </SelectContent>
        </Select>

        <SalaryRangeFilter
          salaryMin={salaryMin}
          salaryMax={salaryMax}
          onChange={onSalaryChange}
        />

        <SkillsFilter skills={skills} onChange={onSkillsChange} />
      </div>
    </div>
  );
};

export default JobFilterBar;
