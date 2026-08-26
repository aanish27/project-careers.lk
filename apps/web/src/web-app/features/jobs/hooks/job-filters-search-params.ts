// jobs/hooks/job-filters-search-params.ts
import {
  parseAsArrayOf,
  parseAsStringEnum,
  createLoader,
  parseAsString,
} from "nuqs/server";
import { WorkMode, EmploymentType } from "@careerslk/types";

export const jobFiltersParsers = {
  province: parseAsArrayOf(parseAsString).withDefault([]),
  district: parseAsArrayOf(parseAsString).withDefault([]),
  workMode: parseAsArrayOf(
    parseAsStringEnum(Object.values(WorkMode)),
  ).withDefault([]),
  employmentType: parseAsArrayOf(
    parseAsStringEnum(Object.values(EmploymentType)),
  ).withDefault([]),
};

export const loadJobFilters = createLoader(jobFiltersParsers);
