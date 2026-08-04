import type { AbuseReport, FileReportInput } from "@careerslk/types";
import { apiFetch } from "@lib/api-client";
import "server-only";

export async function fileReportRequest(
  accessToken: string,
  input: FileReportInput,
): Promise<AbuseReport> {
  const { data } = await apiFetch<AbuseReport>("/web-users/reports", {
    method: "POST",
    body: JSON.stringify(input),
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}
