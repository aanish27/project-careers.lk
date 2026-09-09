"use server";

import {
  type Company,
  createWebUserCompanySchema,
  updateWebUserCompanySchema,
} from "@careerslk/types";
import { ApiError } from "@lib/api-client";
import {
  claimCompanyRequest,
  type ClaimCompanyResult,
  type CompanySearchResult,
  createCompanyRequest,
  fetchCurrentWebUser,
  requestCompanyAutoApprovalRequest,
  searchCompaniesRequest,
  updateMyCompanyRequest,
  uploadCompanyLogoRequest,
} from "@web-app-lib/web-user-client";
import { fieldErrorsFromZod } from "@web-app-lib/form-validation";
import {
  getValidWebUserAccessToken,
  updateWebUserSessionUser,
} from "@web-app-lib/web-user-session";
import { redirect } from "next/navigation";

function optionalString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value.trim();
}

export type SearchCompaniesResult =
  | { ok: true; results: CompanySearchResult[] }
  | { requiresAuth: true }
  | { error: string };

export async function searchCompanies(
  q: string,
): Promise<SearchCompaniesResult> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return { requiresAuth: true };

  try {
    const results = await searchCompaniesRequest(accessToken, q);
    return { ok: true, results };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export type ClaimCompanyActionResult =
  | { ok: true; result: ClaimCompanyResult }
  | { requiresAuth: true }
  | { error: string };

export async function claimCompany(
  companyId: number,
): Promise<ClaimCompanyActionResult> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return { requiresAuth: true };

  try {
    const result = await claimCompanyRequest(accessToken, companyId);
    if (result.status === "APPROVED") {
      const user = await fetchCurrentWebUser(accessToken);
      await updateWebUserSessionUser(user);
    }
    return { ok: true, result };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }
}

export type CompanyFormState =
  | { error?: string; fieldErrors?: Record<string, string> }
  | undefined;

export async function createCompany(
  _state: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) redirect("/login");

  const parsed = createWebUserCompanySchema.safeParse({
    name: optionalString(formData.get("name")),
    websiteUrl: optionalString(formData.get("websiteUrl")),
    description: optionalString(formData.get("description")),
    linkedinUrl: optionalString(formData.get("linkedinUrl")),
    twitterUrl: optionalString(formData.get("twitterUrl")),
    facebookUrl: optionalString(formData.get("facebookUrl")),
    instagramUrl: optionalString(formData.get("instagramUrl")),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }
  const input = parsed.data;

  try {
    await createCompanyRequest(accessToken, input);
    const user = await fetchCurrentWebUser(accessToken);
    await updateWebUserSessionUser(user);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/account/company");
}

export async function updateCompany(
  _state: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) redirect("/login");

  const parsed = updateWebUserCompanySchema.safeParse({
    name: optionalString(formData.get("name")),
    websiteUrl: optionalString(formData.get("websiteUrl")),
    description: optionalString(formData.get("description")),
    linkedinUrl: optionalString(formData.get("linkedinUrl")),
    twitterUrl: optionalString(formData.get("twitterUrl")),
    facebookUrl: optionalString(formData.get("facebookUrl")),
    instagramUrl: optionalString(formData.get("instagramUrl")),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }
  const input = parsed.data;

  try {
    await updateMyCompanyRequest(accessToken, input);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/account/company");
}

export type LogoUploadResult =
  | { ok: true; logoUrl: string | null }
  | { requiresAuth: true }
  | { error: string };

export async function uploadCompanyLogo(file: File): Promise<LogoUploadResult> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return { requiresAuth: true };

  try {
    const company = await uploadCompanyLogoRequest(accessToken, file);
    return { ok: true, logoUrl: company.logoUrl };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }
}

export type AutoApprovalActionResult =
  | { ok: true; status: Company["autoApprovalStatus"] }
  | { requiresAuth: true }
  | { error: string };

export async function requestAutoApproval(): Promise<AutoApprovalActionResult> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return { requiresAuth: true };

  try {
    const company = await requestCompanyAutoApprovalRequest(accessToken);
    return { ok: true, status: company.autoApprovalStatus };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }
}
