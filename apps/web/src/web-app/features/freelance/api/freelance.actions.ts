"use server";

import type {
  CreateFreelanceProfileInput,
  CreateGigInput,
  FreelanceProfile,
  Gig,
  UpdateFreelanceProfileInput,
} from "@careerslk/types";
import { ApiError } from "@lib/api-client";
import {
  createFreelanceProfileRequest,
  fetchMyFreelanceProfileRequest,
  submitGigRequest,
  updateMyFreelanceProfileRequest,
  uploadCvRequest,
  uploadPortfolioFilesRequest,
  withdrawMyFreelanceProfileRequest,
} from "@web-app-lib/freelance-client";
import { getValidWebUserAccessToken } from "@web-app-lib/web-user-session";
import { redirect } from "next/navigation";

function optionalString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value.trim();
}

function optionalNumber(value: FormDataEntryValue | null): number | undefined {
  const str = optionalString(value);
  if (str === undefined) return undefined;
  const n = Number(str);
  return Number.isFinite(n) ? n : undefined;
}

function listInput(value: FormDataEntryValue | null): string[] {
  const str = optionalString(value);
  if (!str) return [];
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function profileInputFromFormData(
  formData: FormData,
): CreateFreelanceProfileInput | UpdateFreelanceProfileInput {
  return {
    bio: optionalString(formData.get("bio")),
    rate: optionalNumber(formData.get("rate")),
    rateCurrency: optionalString(formData.get("rateCurrency")),
    category: optionalString(formData.get("category")),
    skills: listInput(formData.get("skills")),
    portfolioLinks: listInput(formData.get("portfolioLinks")),
  };
}

export async function fetchMyFreelanceProfile(): Promise<FreelanceProfile | null> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return null;
  return fetchMyFreelanceProfileRequest(accessToken);
}

export type FreelanceProfileFormState = { error?: string } | undefined;

export async function createFreelanceProfile(
  _state: FreelanceProfileFormState,
  formData: FormData,
): Promise<FreelanceProfileFormState> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) redirect("/login");

  try {
    await createFreelanceProfileRequest(
      accessToken,
      profileInputFromFormData(formData) as CreateFreelanceProfileInput,
    );
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/freelance/profile/edit");
}

export async function updateFreelanceProfile(
  _state: FreelanceProfileFormState,
  formData: FormData,
): Promise<FreelanceProfileFormState> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) redirect("/login");

  try {
    await updateMyFreelanceProfileRequest(
      accessToken,
      profileInputFromFormData(formData),
    );
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/freelance/profile/edit");
}

export async function withdrawFreelanceProfile(): Promise<void> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) redirect("/login");
  await withdrawMyFreelanceProfileRequest(accessToken);
  redirect("/freelance");
}

export type FileUploadResult =
  | { ok: true; profile: FreelanceProfile }
  | { requiresAuth: true }
  | { error: string };

export async function uploadCv(file: File): Promise<FileUploadResult> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return { requiresAuth: true };

  try {
    const profile = await uploadCvRequest(accessToken, file);
    return { ok: true, profile };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }
}

export async function uploadPortfolioFiles(
  files: File[],
): Promise<FileUploadResult> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return { requiresAuth: true };

  try {
    const profile = await uploadPortfolioFilesRequest(accessToken, files);
    return { ok: true, profile };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }
}

export type GigFormState = { error?: string } | undefined;

export async function submitGig(
  _state: GigFormState,
  formData: FormData,
): Promise<GigFormState> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) redirect("/login");

  const title = formData.get("title");
  if (typeof title !== "string" || !title.trim()) {
    return { error: "Title is required" };
  }

  const input: CreateGigInput = {
    title: title.trim(),
    description: optionalString(formData.get("description")),
    category: optionalString(formData.get("category")),
    skills: listInput(formData.get("skills")),
    budgetMin: optionalNumber(formData.get("budgetMin")),
    budgetMax: optionalNumber(formData.get("budgetMax")),
    budgetCurrency: optionalString(formData.get("budgetCurrency")),
  };

  let gig: Gig;
  try {
    gig = await submitGigRequest(accessToken, input);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }

  redirect(`/freelance/gigs/${gig.slug}`);
}
