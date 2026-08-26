"use server";

import { apiFetch } from "@/lib/api-client";

export type SaveJobResult = { ok: true } | { error: string };

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
