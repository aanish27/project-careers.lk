"use server";

import { jobsApi } from "./api";
import type { JobFilters } from "../types";

export async function listJobsAction(filters: JobFilters) {
  return jobsApi.list(filters); // still goes through the server-only apiFetch
}
