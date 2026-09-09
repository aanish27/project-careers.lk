import { ApiError } from "@/lib/api-client";
import { jobsApi } from "../api/api";
import { PublicJobDetailResponse } from "../types";

const EXPIRED_JOB_RETIREMENT_DAYS = 90;

export async function loadJob(
  slug: string,
): Promise<PublicJobDetailResponse | null> {
  try {
    return await jobsApi.getBySlug(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export function isRetired(job: PublicJobDetailResponse["job"]): boolean {
  if (job.status !== "EXPIRED") return false;
  const daysSinceLastSeen =
    (Date.now() - new Date(job.lastSeenAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceLastSeen > EXPIRED_JOB_RETIREMENT_DAYS;
}
