"use server";

import type { AbuseReport, FileReportInput } from "@careerslk/types";
import { ApiError } from "@lib/api-client";
import { fileReportRequest } from "@web-app-lib/reports-client";
import { getValidWebUserAccessToken } from "@web-app-lib/web-user-session";

export type FileReportResult =
  | { ok: true; data: AbuseReport }
  | { requiresAuth: true }
  | { error: string };

export async function fileReport(
  input: FileReportInput,
): Promise<FileReportResult> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return { requiresAuth: true };

  try {
    const data = await fileReportRequest(accessToken, input);
    return { ok: true, data };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }
}
