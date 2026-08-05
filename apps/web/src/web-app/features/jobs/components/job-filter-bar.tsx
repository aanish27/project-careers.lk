"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDistrictsForProvince, PROVINCES } from "@careerslk/types";
import {
  IconBriefcase,
  IconBuildingSkyscraper,
  IconMapPin,
} from "@tabler/icons-react";

type JobFilterBarProps = {
  resultCount: number;
  province: string;
  onProvinceChange: (value: string) => void;
  district: string;
  onDistrictChange: (value: string) => void;
  workMode: string;
  onWorkModeChange: (value: string) => void;
  employmentType: string;
  onEmploymentTypeChange: (value: string) => void;
};

const JobFilterBar = ({
  resultCount,
  province,
  onProvinceChange,
  district,
  onDistrictChange,
  workMode,
  onWorkModeChange,
  employmentType,
  onEmploymentTypeChange,
}: JobFilterBarProps) => {
  const districts = getDistrictsForProvince(
    province !== "all" ? province : undefined,
  );

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
      <h2 className="text-xl font-bold text-foreground">
        Jobs{" "}
        <span className="text-xs font-normal text-muted-foreground">
          ({resultCount})
        </span>
      </h2>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={province}
          onValueChange={(value) => onProvinceChange(value ?? "all")}
        >
          <SelectTrigger className="gap-2 rounded-full border-border bg-white px-4">
            <IconMapPin className="size-4 text-muted-foreground" />
            <SelectValue placeholder="Province" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Provinces</SelectItem>
            {PROVINCES.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={district}
          onValueChange={(value) => onDistrictChange(value ?? "all")}
        >
          <SelectTrigger
            className="gap-2 rounded-full border-border bg-white px-4"
            disabled={province === "all"}
          >
            <IconMapPin className="size-4 text-muted-foreground" />
            <SelectValue placeholder="District" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {districts.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default JobFilterBar;
