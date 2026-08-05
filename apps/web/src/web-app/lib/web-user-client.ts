import type {
  Company,
  CreateWebUserCompanyInput,
  CreateWebUserJobInput,
  Job,
  JobWithCompany,
  UpdateWebUserCompanyInput,
  UpdateWebUserJobInput,
  UpdateWebUserProfileInput,
} from "@careerslk/types";
import { ClaimStatus } from "@careerslk/types";
import { apiFetch, ApiError, extractCookieValue } from "@lib/api-client";
import "server-only";

export interface WebUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  companyId: number | null;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

// The shared secret proving these calls come from this server (see
// InternalOnlyGuard on the API) — required on every web-user-auth endpoint
// that either trusts an externally-verified profile (Google) or needs
// per-recipient-email abuse protection the API can't get from the caller's
// IP alone (email OTP), since the browser never calls the API directly.
function getInternalKey(): string {
  const internalKey = process.env.INTERNAL_API_KEY;
  if (!internalKey) {
    throw new Error("INTERNAL_API_KEY is not configured");
  }
  return internalKey;
}

// Called only from the OAuth callback Route Handler after this server has
// already exchanged the code with Google directly and confirmed the profile.
export async function googleUpsertRequest(
  profile: GoogleProfile,
): Promise<{ user: WebUser; accessToken: string; refreshToken: string }> {
  const { data, setCookies } = await apiFetch<{
    user: WebUser;
    accessToken: string;
  }>("/web-users/auth/google/upsert", {
    method: "POST",
    body: JSON.stringify(profile),
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": getInternalKey(),
    },
  });

  const refreshToken = extractCookieValue(setCookies, "webUserRefreshToken");
  if (!refreshToken) {
    throw new ApiError(
      500,
      "MISSING_REFRESH_COOKIE",
      "Google upsert response did not include a refresh token",
    );
  }

  return { user: data.user, accessToken: data.accessToken, refreshToken };
}

export async function requestEmailOtpRequest(email: string): Promise<void> {
  await apiFetch("/web-users/auth/email/otp/request", {
    method: "POST",
    body: JSON.stringify({ email }),
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": getInternalKey(),
    },
  });
}

export async function verifyEmailOtpRequest(
  email: string,
  code: string,
): Promise<{ user: WebUser; accessToken: string; refreshToken: string }> {
  const { data, setCookies } = await apiFetch<{
    user: WebUser;
    accessToken: string;
  }>("/web-users/auth/email/otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": getInternalKey(),
    },
  });

  const refreshToken = extractCookieValue(setCookies, "webUserRefreshToken");
  if (!refreshToken) {
    throw new ApiError(
      500,
      "MISSING_REFRESH_COOKIE",
      "OTP verify response did not include a refresh token",
    );
  }

  return { user: data.user, accessToken: data.accessToken, refreshToken };
}

export async function webUserLogoutRequest(accessToken: string): Promise<void> {
  await apiFetch("/web-users/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function fetchCurrentWebUser(
  accessToken: string,
): Promise<WebUser> {
  const { data } = await apiFetch<WebUser>("/web-users/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function saveJobRequest(
  accessToken: string,
  jobId: number,
): Promise<void> {
  await apiFetch(`/web-users/jobs/${jobId}/save`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function unsaveJobRequest(
  accessToken: string,
  jobId: number,
): Promise<void> {
  await apiFetch(`/web-users/jobs/${jobId}/save`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function updateWebUserProfileRequest(
  accessToken: string,
  input: UpdateWebUserProfileInput,
): Promise<WebUser> {
  const { data } = await apiFetch<WebUser>("/web-users/me", {
    method: "PATCH",
    body: JSON.stringify(input),
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export interface SavedJobEntry {
  id: number;
  webUserId: number;
  jobId: number;
  createdAt: string;
  job: Job & { company: Pick<Company, "id" | "name" | "logoUrl" | "slug"> };
}

export async function submitJobRequest(
  accessToken: string,
  input: CreateWebUserJobInput,
): Promise<Job> {
  const { data } = await apiFetch<Job>("/web-users/jobs", {
    method: "POST",
    body: JSON.stringify(input),
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function uploadJobImageRequest(
  accessToken: string,
  jobId: number,
  file: File,
): Promise<Job> {
  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}/web-users/jobs/${jobId}/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Unable to reach the API server");
  }

  const body = (await res.json()) as
    | { success: true; data: Job }
    | {
        success: false;
        error: { code: string; message: string; details?: unknown };
      };

  if (body.success) {
    return body.data;
  }

  throw new ApiError(
    res.status,
    body.error.code,
    body.error.message,
    body.error.details,
  );
}

export async function fetchMyJobsRequest(
  accessToken: string,
): Promise<JobWithCompany[]> {
  const { data } = await apiFetch<JobWithCompany[]>("/web-users/jobs/mine", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function updateJobRequest(
  accessToken: string,
  jobId: number,
  input: UpdateWebUserJobInput,
): Promise<Job> {
  const { data } = await apiFetch<Job>(`/web-users/jobs/${jobId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function withdrawJobRequest(
  accessToken: string,
  jobId: number,
): Promise<void> {
  await apiFetch(`/web-users/jobs/${jobId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function fetchSavedJobsRequest(
  accessToken: string,
): Promise<SavedJobEntry[]> {
  const { data } = await apiFetch<SavedJobEntry[]>("/web-users/jobs/saved", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export interface CompanySearchResult {
  id: number;
  name: string;
  websiteUrl: string | null;
  logoUrl: string | null;
}

export async function searchCompaniesRequest(
  accessToken: string,
  q: string,
): Promise<CompanySearchResult[]> {
  const { data } = await apiFetch<CompanySearchResult[]>(
    `/web-users/companies/search?q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return data;
}

export async function createCompanyRequest(
  accessToken: string,
  input: CreateWebUserCompanyInput,
): Promise<Company> {
  const { data } = await apiFetch<Company>("/web-users/companies", {
    method: "POST",
    body: JSON.stringify(input),
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export type ClaimCompanyResult =
  | { status: typeof ClaimStatus.APPROVED; companyId: number }
  | {
      status: typeof ClaimStatus.PENDING | typeof ClaimStatus.REJECTED;
      claimId: number;
    };

export async function claimCompanyRequest(
  accessToken: string,
  companyId: number,
): Promise<ClaimCompanyResult> {
  const { data } = await apiFetch<ClaimCompanyResult>(
    `/web-users/companies/${companyId}/claim`,
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return data;
}

export async function fetchMyCompanyRequest(
  accessToken: string,
): Promise<Company | null> {
  const { data } = await apiFetch<Company | null>("/web-users/companies/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function updateMyCompanyRequest(
  accessToken: string,
  input: UpdateWebUserCompanyInput,
): Promise<Company> {
  const { data } = await apiFetch<Company>("/web-users/companies/me", {
    method: "PATCH",
    body: JSON.stringify(input),
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function requestCompanyAutoApprovalRequest(
  accessToken: string,
): Promise<Company> {
  const { data } = await apiFetch<Company>(
    "/web-users/companies/me/request-auto-approval",
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return data;
}

// Multipart upload can't go through `apiFetch` — it always forces
// `Content-Type: application/json`, which breaks the multipart boundary the
// browser/undici needs to set itself. This mirrors apiFetch's envelope
// handling by hand instead.
export async function uploadCompanyLogoRequest(
  accessToken: string,
  file: File,
): Promise<Company> {
  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}/web-users/companies/me/logo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Unable to reach the API server");
  }

  const body = (await res.json()) as
    | { success: true; data: Company }
    | {
        success: false;
        error: { code: string; message: string; details?: unknown };
      };

  if (body.success) {
    return body.data;
  }

  throw new ApiError(
    res.status,
    body.error.code,
    body.error.message,
    body.error.details,
  );
}

export async function webUserRefreshRequest(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const { data, setCookies } = await apiFetch<{ accessToken: string }>(
    "/web-users/auth/refresh",
    {
      method: "POST",
      headers: { Cookie: `webUserRefreshToken=${refreshToken}` },
    },
  );

  const rotatedRefreshToken = extractCookieValue(
    setCookies,
    "webUserRefreshToken",
  );
  if (!rotatedRefreshToken) {
    throw new ApiError(
      500,
      "MISSING_REFRESH_COOKIE",
      "Refresh response did not include a rotated refresh token",
    );
  }

  return { accessToken: data.accessToken, refreshToken: rotatedRefreshToken };
}
