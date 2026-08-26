"use client";

import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import {
  EmploymentType,
  getDistrictsForProvince,
  PROVINCES,
  WorkMode,
} from "@careerslk/types";
import { IconBuildingSkyscraper } from "@tabler/icons-react";
import { useMemo } from "react";
import { JobFilters } from "../types";
import { JobsBreadcrumb } from "./breadcrumb";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { IBreadcrumbItem } from "@web-app-features/ui/types";

type JobFilterBarProps = {
  breadcrumbs?: IBreadcrumbItem[];
  onProvinceChange: (value: string[]) => void;
  onDistrictChange: (value: string[]) => void;
  onWorkModeChange: (value: WorkMode[]) => void;
  onEmploymentTypeChange: (value: EmploymentType[]) => void;
} & Pick<JobFilters, "province" | "district" | "workMode" | "employmentType">;

const JobFilterBar = ({
  province,
  onProvinceChange,
  district,
  onDistrictChange,
  workMode,
  onWorkModeChange,
  employmentType,
  onEmploymentTypeChange,
  breadcrumbs,
}: JobFilterBarProps) => {
  let districts = undefined;

  if (province?.length == 1) {
    districts = getDistrictsForProvince(province[0]);
  }

  const workModeOptions = useMemo(() => Object.values(WorkMode), []);
  const employmentTypeOptions = useMemo(
    () => Object.values(EmploymentType),
    [],
  );
  const provinceOptions = useMemo(() => Object.values(PROVINCES), []);

  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <JobsBreadcrumb breadcrumbs={breadcrumbs} />
      <div className="flex items-center gap-3 ">
        <MultiSelect
          values={province ? province : undefined}
          onValuesChange={(values) => onProvinceChange(values as string[])}
        >
          <MultiSelectTrigger className="max-w-40.5 rounded-full">
            <IconBuildingSkyscraper size="15" />
            <MultiSelectValue
              placeholder="Province"
              overflowBehavior="cutoff"
            />
          </MultiSelectTrigger>
          <MultiSelectContent>
            <MultiSelectGroup>
              {provinceOptions.map((province, index) => (
                <MultiSelectItem key={index} value={province}>
                  {province}
                </MultiSelectItem>
              ))}
            </MultiSelectGroup>
          </MultiSelectContent>
        </MultiSelect>

        <MultiSelect
          values={district ? district : undefined}
          onValuesChange={(values) => onDistrictChange(values as string[])}
        >
          <MultiSelectTrigger
            className="max-w-40.5 rounded-full"
            disabled={districts ? false : true}
          >
            <IconBuildingSkyscraper size="15" />
            <MultiSelectValue
              placeholder="District"
              overflowBehavior="cutoff"
            />
          </MultiSelectTrigger>
          <MultiSelectContent>
            <MultiSelectGroup>
              {districts?.map((district, index) => (
                <MultiSelectItem key={index} value={district}>
                  {district}
                </MultiSelectItem>
              ))}
            </MultiSelectGroup>
          </MultiSelectContent>
        </MultiSelect>

        <MultiSelect
          values={workMode ? workMode : undefined}
          onValuesChange={(values) => onWorkModeChange(values as WorkMode[])}
        >
          <MultiSelectTrigger className="max-w-40.5 rounded-full">
            <IconBuildingSkyscraper size="15" />
            <MultiSelectValue
              placeholder="Work mode"
              overflowBehavior="cutoff"
            />
          </MultiSelectTrigger>
          <MultiSelectContent>
            <MultiSelectGroup>
              {workModeOptions.map((mode, index) => (
                <MultiSelectItem key={index} value={mode}>
                  {mode}
                </MultiSelectItem>
              ))}
            </MultiSelectGroup>
          </MultiSelectContent>
        </MultiSelect>

        <MultiSelect
          values={employmentType ? employmentType : undefined}
          onValuesChange={(values) =>
            onEmploymentTypeChange(values as EmploymentType[])
          }
        >
          <MultiSelectTrigger className="max-w-40.5 rounded-full">
            <IconBuildingSkyscraper size="15" />
            <MultiSelectValue placeholder="Type" overflowBehavior="cutoff" />
          </MultiSelectTrigger>
          <MultiSelectContent>
            <MultiSelectGroup>
              {employmentTypeOptions.map((mode, index) => (
                <MultiSelectItem key={index} value={mode}>
                  {mode.replace("_", " ")}
                </MultiSelectItem>
              ))}
            </MultiSelectGroup>
          </MultiSelectContent>
        </MultiSelect>
      </div>
    </div>
  );
};

export default JobFilterBar;
