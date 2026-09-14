"use server";

import { apiFetch } from "@/lib/api-client";
import { getValidWebUserAccessToken } from "@/web-app/lib/web-user-session";

export type SaveJobResult = { ok: true } | { error: string };

export async function getJobSavedStatus(jobId: number): Promise<boolean> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return false;

  try {
    const { data } = await apiFetch<{ saved: boolean }>(
      `/web-users/jobs/${jobId}/save`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return data.saved;
  } catch {
    return false;
  }
}

export async function saveJob(jobId: number): Promise<SaveJobResult> {
  try {
    await apiFetch(`/web-users/jobs/${jobId}/save`, {
      method: "POST",
      auth: true,
    });
    return { ok: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function unsaveJob(jobId: number): Promise<SaveJobResult> {
  try {
    await apiFetch(`/web-users/jobs/${jobId}/save`, {
      method: "DELETE",
      auth: true,
    });
    return { ok: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
