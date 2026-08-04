"use server";

import { saveJobRequest, unsaveJobRequest } from "@web-app-lib/web-user-client";
import { getValidWebUserAccessToken } from "@web-app-lib/web-user-session";

export type SaveJobResult =
  | { ok: true }
  | { requiresAuth: true }
  | { error: string };

export async function saveJob(jobId: number): Promise<SaveJobResult> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return { requiresAuth: true };

  try {
    await saveJobRequest(accessToken, jobId);
    return { ok: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function unsaveJob(jobId: number): Promise<SaveJobResult> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return { requiresAuth: true };

  try {
    await unsaveJobRequest(accessToken, jobId);
    return { ok: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
