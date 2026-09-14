"use server";

import { type Company, type CreateWebUserCompanyInput } from "@careerslk/types";
import { toActionErrorMessage } from "@lib/api-client";
import {
  claimCompanyRequest,
  type ClaimCompanyResult,
  type CompanySearchResult,
  createCompanyRequest,
  fetchCurrentWebUser,
  requestCompanyAutoApprovalRequest,
  searchCompaniesRequest,
  updateMyCompanyRequest,
  uploadCompanyBrImageRequest,
  uploadCompanyLogoRequest,
} from "@web-app-lib/web-user-client";
import {
  getValidWebUserAccessToken,
  updateWebUserSessionUser,
} from "@web-app-lib/web-user-session";
import { redirect } from "next/navigation";

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
    return {
      error: toActionErrorMessage(
        err,
        "Something went wrong. Please try again.",
      ),
    };
  }
}

export type CompanyFormState = { error?: string } | undefined;

export async function createCompany(
  _state: CompanyFormState,
  data: CreateWebUserCompanyInput,
): Promise<CompanyFormState> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) redirect("/login");

  try {
    await createCompanyRequest(accessToken, data);
    const user = await fetchCurrentWebUser(accessToken);
    await updateWebUserSessionUser(user);
  } catch (err) {
    return {
      error: toActionErrorMessage(
        err,
        "Something went wrong. Please try again.",
      ),
    };
  }

  redirect("/account/company");
}

export async function updateCompany(
  _state: CompanyFormState,
  data: CreateWebUserCompanyInput,
): Promise<CompanyFormState> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) redirect("/login");

  try {
    await updateMyCompanyRequest(accessToken, data);
  } catch (err) {
    return {
      error: toActionErrorMessage(
        err,
        "Something went wrong. Please try again.",
      ),
    };
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
    return {
      error: toActionErrorMessage(
        err,
        "Something went wrong. Please try again.",
      ),
    };
  }
}

export type BrImageUploadResult =
  | { ok: true; brImageUrl: string | null }
  | { requiresAuth: true }
  | { error: string };

export async function uploadCompanyBrImage(
  file: File,
): Promise<BrImageUploadResult> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return { requiresAuth: true };

  try {
    const company = await uploadCompanyBrImageRequest(accessToken, file);
    return { ok: true, brImageUrl: company.brImageUrl };
  } catch (err) {
    return {
      error: toActionErrorMessage(
        err,
        "Something went wrong. Please try again.",
      ),
    };
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
    return {
      error: toActionErrorMessage(
        err,
        "Something went wrong. Please try again.",
      ),
    };
  }
}
