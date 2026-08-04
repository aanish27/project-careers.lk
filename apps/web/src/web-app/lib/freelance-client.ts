import type {
  CreateFreelanceProfileInput,
  CreateGigInput,
  FreelanceProfile,
  Gig,
  UpdateFreelanceProfileInput,
  UpdateGigInput,
} from "@careerslk/types";
import { ApiError, apiFetch } from "@lib/api-client";
import "server-only";

export async function createFreelanceProfileRequest(
  accessToken: string,
  input: CreateFreelanceProfileInput,
): Promise<FreelanceProfile> {
  const { data } = await apiFetch<FreelanceProfile>(
    "/web-users/freelance-profiles",
    {
      method: "POST",
      body: JSON.stringify(input),
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  return data;
}

export async function fetchMyFreelanceProfileRequest(
  accessToken: string,
): Promise<FreelanceProfile | null> {
  const { data } = await apiFetch<FreelanceProfile | null>(
    "/web-users/freelance-profiles/me",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return data;
}

export async function updateMyFreelanceProfileRequest(
  accessToken: string,
  input: UpdateFreelanceProfileInput,
): Promise<FreelanceProfile> {
  const { data } = await apiFetch<FreelanceProfile>(
    "/web-users/freelance-profiles/me",
    {
      method: "PATCH",
      body: JSON.stringify(input),
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  return data;
}

export async function withdrawMyFreelanceProfileRequest(
  accessToken: string,
): Promise<void> {
  await apiFetch("/web-users/freelance-profiles/me", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Multipart uploads can't go through `apiFetch` (it always forces
// `Content-Type: application/json`) — mirrors apiFetch's envelope handling
// by hand instead, same as uploadCompanyLogoRequest.
async function uploadMultipart<T>(
  path: string,
  accessToken: string,
  formData: FormData,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Unable to reach the API server");
  }

  const body = (await res.json()) as
    | { success: true; data: T }
    | {
        success: false;
        error: { code: string; message: string; details?: unknown };
      };

  if (body.success) return body.data;

  throw new ApiError(
    res.status,
    body.error.code,
    body.error.message,
    body.error.details,
  );
}

export async function uploadCvRequest(
  accessToken: string,
  file: File,
): Promise<FreelanceProfile> {
  const formData = new FormData();
  formData.append("file", file);
  return uploadMultipart<FreelanceProfile>(
    "/web-users/freelance-profiles/me/cv",
    accessToken,
    formData,
  );
}

export async function uploadPortfolioFilesRequest(
  accessToken: string,
  files: File[],
): Promise<FreelanceProfile> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return uploadMultipart<FreelanceProfile>(
    "/web-users/freelance-profiles/me/portfolio-files",
    accessToken,
    formData,
  );
}

export async function submitGigRequest(
  accessToken: string,
  input: CreateGigInput,
): Promise<Gig> {
  const { data } = await apiFetch<Gig>("/web-users/gigs", {
    method: "POST",
    body: JSON.stringify(input),
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function fetchMyGigsRequest(accessToken: string): Promise<Gig[]> {
  const { data } = await apiFetch<Gig[]>("/web-users/gigs/mine", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function updateGigRequest(
  accessToken: string,
  gigId: number,
  input: UpdateGigInput,
): Promise<Gig> {
  const { data } = await apiFetch<Gig>(`/web-users/gigs/${gigId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function withdrawGigRequest(
  accessToken: string,
  gigId: number,
): Promise<void> {
  await apiFetch(`/web-users/gigs/${gigId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function uploadGigAttachmentsRequest(
  accessToken: string,
  gigId: number,
  files: File[],
): Promise<Gig> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return uploadMultipart<Gig>(
    `/web-users/gigs/${gigId}/attachments`,
    accessToken,
    formData,
  );
}
