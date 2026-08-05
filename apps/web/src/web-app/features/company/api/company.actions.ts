"use server";

import type {
  Company,
  CreateWebUserCompanyInput,
  UpdateWebUserCompanyInput,
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

export type CompanyFormState = { error?: string } | undefined;

export async function createCompany(
  _state: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) redirect("/login");

  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) {
    return { error: "Company name is required" };
  }

  const input: CreateWebUserCompanyInput = {
    name: name.trim(),
    websiteUrl: optionalString(formData.get("websiteUrl")),
    description: optionalString(formData.get("description")),
    linkedinUrl: optionalString(formData.get("linkedinUrl")),
    twitterUrl: optionalString(formData.get("twitterUrl")),
    facebookUrl: optionalString(formData.get("facebookUrl")),
    instagramUrl: optionalString(formData.get("instagramUrl")),
  };

  try {
    await createCompanyRequest(accessToken, input);
    const user = await fetchCurrentWebUser(accessToken);
    await updateWebUserSessionUser(user);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/company");
}

export async function updateCompany(
  _state: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) redirect("/login");

  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) {
    return { error: "Company name is required" };
  }

  const input: UpdateWebUserCompanyInput = {
    name: name.trim(),
    description: optionalString(formData.get("description")),
    linkedinUrl: optionalString(formData.get("linkedinUrl")),
    twitterUrl: optionalString(formData.get("twitterUrl")),
    facebookUrl: optionalString(formData.get("facebookUrl")),
    instagramUrl: optionalString(formData.get("instagramUrl")),
  };

  try {
    await updateMyCompanyRequest(accessToken, input);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/company");
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
