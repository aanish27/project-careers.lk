"use server";

import type {
  CreateWebUserCompanyInput,
  CreateWebUserJobInput,
} from "@careerslk/types";
import { ApiError } from "@lib/api-client";
import {
  createCompanyRequest,
  fetchCurrentWebUser,
  submitJobRequest,
  uploadJobImageRequest,
} from "@web-app-lib/web-user-client";
import {
  getValidWebUserAccessToken,
  updateWebUserSessionUser,
} from "@web-app-lib/web-user-session";
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

  // Present only when the poster has no linked company yet — the form
  // collects just enough to create one inline, so posting a job never
  // requires a separate company-setup detour first.
  const companyName = optionalString(formData.get("companyName"));
  if (companyName) {
    const companyInput: CreateWebUserCompanyInput = {
      name: companyName,
      websiteUrl: optionalString(formData.get("companyWebsiteUrl")),
      careerUrl: optionalString(formData.get("companyCareerUrl")),
    };

    try {
      await createCompanyRequest(accessToken, companyInput);
      const user = await fetchCurrentWebUser(accessToken);
      await updateWebUserSessionUser(user);
    } catch (err) {
      if (err instanceof ApiError) return { error: err.message };
      return {
        error:
          "Something went wrong setting up your company. Please try again.",
      };
    }
  }

  const title = formData.get("title");
  if (typeof title !== "string" || !title.trim()) {
    return { error: "Title is required" };
  }

  const workMode = formData.get("workMode");
  if (typeof workMode !== "string" || !workMode.trim()) {
    return { error: "Work mode is required" };
  }

  const province = formData.get("province");
  const district = formData.get("district");
  if (typeof province !== "string" || !province.trim()) {
    return { error: "Province is required" };
  }
  if (typeof district !== "string" || !district.trim()) {
    return { error: "District is required" };
  }

  const deadline = optionalString(formData.get("deadline"));

  const input: CreateWebUserJobInput = {
    title: title.trim(),
    province: province.trim(),
    district: district.trim(),
    city: optionalString(formData.get("city")),
    workMode: workMode as CreateWebUserJobInput["workMode"],
    employmentType: optionalString(
      formData.get("employmentType"),
    ) as CreateWebUserJobInput["employmentType"],
    sector: optionalString(formData.get("sector")),
    roleCategory: optionalString(formData.get("roleCategory")),
    salaryMin: optionalInt(formData.get("salaryMin")),
    salaryMax: optionalInt(formData.get("salaryMax")),
    salaryCurrency: optionalString(formData.get("salaryCurrency")),
    salaryRaw: optionalString(formData.get("salaryRaw")),
    description: optionalString(formData.get("description")),
    deadline: deadline ? new Date(deadline).toISOString() : undefined,
    applyUrl: optionalString(formData.get("applyUrl")),
  };

  let jobId: number;
  try {
    const job = await submitJobRequest(accessToken, input);
    jobId = job.id;
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }

  // The job is already posted at this point — a failed image upload
  // shouldn't block the redirect, just leave the job without an image.
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    await uploadJobImageRequest(accessToken, jobId, image).catch(() => {});
  }

  redirect("/profile");
};
