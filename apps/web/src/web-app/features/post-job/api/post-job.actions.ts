"use server";

import type { CreateWebUserJobInput } from "@careerslk/types";
import { ApiError } from "@lib/api-client";
import { submitJobRequest } from "@web-app-lib/web-user-client";
import { getValidWebUserAccessToken } from "@web-app-lib/web-user-session";
import { redirect } from "next/navigation";

export type PostJobFormState = { error?: string } | undefined;

function optionalString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value.trim();
}

function optionalInt(value: FormDataEntryValue | null): number | undefined {
  const str = optionalString(value);
  if (str === undefined) return undefined;
  const parsed = Number.parseInt(str, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export const postJob = async (
  _state: PostJobFormState,
  formData: FormData,
): Promise<PostJobFormState> => {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) redirect("/login");

  const title = formData.get("title");
  if (typeof title !== "string" || !title.trim()) {
    return { error: "Title is required" };
  }

  const deadline = optionalString(formData.get("deadline"));

  const input: CreateWebUserJobInput = {
    title: title.trim(),
    location: optionalString(formData.get("location")),
    workMode: optionalString(formData.get("workMode")),
    employmentType: optionalString(
      formData.get("employmentType"),
    ) as CreateWebUserJobInput["employmentType"],
    sector: optionalString(formData.get("sector")),
    roleCategory: optionalString(formData.get("roleCategory")),
    department: optionalString(formData.get("department")),
    salaryMin: optionalInt(formData.get("salaryMin")),
    salaryMax: optionalInt(formData.get("salaryMax")),
    salaryCurrency: optionalString(formData.get("salaryCurrency")),
    salaryRaw: optionalString(formData.get("salaryRaw")),
    description: optionalString(formData.get("description")),
    deadline: deadline ? new Date(deadline).toISOString() : undefined,
    applyUrl: optionalString(formData.get("applyUrl")),
  };

  try {
    await submitJobRequest(accessToken, input);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/profile");
};
