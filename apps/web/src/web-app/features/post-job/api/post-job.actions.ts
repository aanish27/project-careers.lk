"use server";

import {
  createWebUserCompanySchema,
  createWebUserJobSchema,
} from "@careerslk/types";
import { toActionErrorMessage } from "@lib/api-client";
import {
  createCompanyRequest,
  fetchCurrentWebUser,
  submitJobRequest,
  uploadJobImageRequest,
} from "@web-app-lib/web-user-client";
import { fieldErrorsFromZod } from "@web-app-lib/form-validation";
import {
  getValidWebUserAccessToken,
  updateWebUserSessionUser,
} from "@web-app-lib/web-user-session";
import { redirect } from "next/navigation";

export type PostJobFormState =
  | { error?: string; fieldErrors?: Record<string, string> }
  | undefined;

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

// Only the fields the inline "no company yet" block collects — not the full
// company schema (no description/social links here).
const postJobCompanySchema = createWebUserCompanySchema.pick({
  name: true,
  websiteUrl: true,
});

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
  let companyInput: ReturnType<typeof postJobCompanySchema.parse> | undefined;
  if (companyName) {
    const companyParsed = postJobCompanySchema.safeParse({
      name: companyName,
      websiteUrl: optionalString(formData.get("companyWebsiteUrl")),
    });
    if (!companyParsed.success) {
      return { fieldErrors: fieldErrorsFromZod(companyParsed.error) };
    }
    companyInput = companyParsed.data;
  }

  const deadline = optionalString(formData.get("deadline"));

  // Validate the job fields before doing anything else, so an invalid job
  // submission never leaves behind a newly-created company with no job.
  const jobParsed = createWebUserJobSchema.safeParse({
    title: optionalString(formData.get("title")),
    province: optionalString(formData.get("province")),
    district: optionalString(formData.get("district")),
    city: optionalString(formData.get("city")),
    workMode: optionalString(formData.get("workMode")),
    employmentType: optionalString(formData.get("employmentType")),
    sector: optionalString(formData.get("sector")),
    roleCategory: optionalString(formData.get("roleCategory")),
    salaryMin: optionalInt(formData.get("salaryMin")),
    salaryMax: optionalInt(formData.get("salaryMax")),
    salaryCurrency: optionalString(formData.get("salaryCurrency")),
    salaryRaw: optionalString(formData.get("salaryRaw")),
    description: optionalString(formData.get("description")),
    deadline: deadline ? new Date(deadline).toISOString() : undefined,
    applyUrl: optionalString(formData.get("applyUrl")),
  });
  if (!jobParsed.success) {
    return { fieldErrors: fieldErrorsFromZod(jobParsed.error) };
  }
  const input = jobParsed.data;

  if (companyInput) {
    try {
      await createCompanyRequest(accessToken, companyInput);
      const user = await fetchCurrentWebUser(accessToken);
      await updateWebUserSessionUser(user);
    } catch (err) {
      return {
        error: toActionErrorMessage(
          err,
          "Something went wrong setting up your company. Please try again.",
        ),
      };
    }
  }

  let jobId: number;
  try {
    const job = await submitJobRequest(accessToken, input);
    jobId = job.id;
  } catch (err) {
    return {
      error: toActionErrorMessage(
        err,
        "Something went wrong. Please try again.",
      ),
    };
  }

  // The job is already posted at this point — a failed image upload
  // shouldn't block the redirect, just leave the job without an image.
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    await uploadJobImageRequest(accessToken, jobId, image).catch(() => {});
  }

  redirect("/account");
};
