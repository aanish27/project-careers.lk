"use server";

import type { UpdateWebUserProfileInput } from "@careerslk/types";
import { ApiError } from "@lib/api-client";
import {
  updateWebUserProfileRequest,
  withdrawJobRequest,
} from "@web-app-lib/web-user-client";
import {
  getValidWebUserAccessToken,
  updateWebUserSessionUser,
} from "@web-app-lib/web-user-session";
import { redirect } from "next/navigation";

export type ProfileFormState = { error?: string } | undefined;

export async function updateProfile(
  _state: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) redirect("/login");

  const firstNameRaw = formData.get("firstName");
  const lastNameRaw = formData.get("lastName");

  const input: UpdateWebUserProfileInput = {
    firstName:
      typeof firstNameRaw === "string"
        ? firstNameRaw.trim() || undefined
        : undefined,
    lastName:
      typeof lastNameRaw === "string"
        ? lastNameRaw.trim() || undefined
        : undefined,
  };

  try {
    const user = await updateWebUserProfileRequest(accessToken, input);
    await updateWebUserSessionUser(user);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/profile");
}

export type WithdrawJobResult =
  | { ok: true }
  | { requiresAuth: true }
  | { error: string };

export async function withdrawJob(jobId: number): Promise<WithdrawJobResult> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return { requiresAuth: true };

  try {
    await withdrawJobRequest(accessToken, jobId);
    return { ok: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
