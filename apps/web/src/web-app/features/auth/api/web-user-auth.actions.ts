"use server";

import { requestEmailOtpSchema, verifyEmailOtpSchema } from "@careerslk/types";
import { redirect } from "next/navigation";
import { ApiError } from "@lib/api-client";
import { isSafeRedirectPath } from "@utils/utils";
import { WEB_USER_ACCESS_TOKEN_TTL_MS } from "@web-app-config/constants";
import {
  requestEmailOtpRequest,
  verifyEmailOtpRequest,
  webUserLogoutRequest,
} from "@web-app-lib/web-user-client";
import { fieldErrorsFromZod } from "@web-app-lib/form-validation";
import {
  createWebUserSession,
  destroyWebUserSession,
  getValidWebUserAccessToken,
} from "@web-app-lib/web-user-session";

export const logout = async (): Promise<void> => {
  const accessToken = await getValidWebUserAccessToken();

  if (accessToken) {
    await webUserLogoutRequest(accessToken).catch(() => {});
  }

  await destroyWebUserSession();
  redirect("/login");
};

export type EmailOtpFormState =
  | { step: "email"; error?: string; fieldErrors?: Record<string, string> }
  | {
      step: "code";
      email: string;
      error?: string;
      fieldErrors?: Record<string, string>;
    }
  | undefined;

export const requestEmailOtp = async (
  _state: EmailOtpFormState,
  formData: FormData,
): Promise<EmailOtpFormState> => {
  const parsed = requestEmailOtpSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { step: "email", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }
  const { email } = parsed.data;

  try {
    await requestEmailOtpRequest(email);
  } catch (err) {
    if (err instanceof ApiError) {
      return { step: "email", error: err.message };
    }
    return { step: "email", error: "Something went wrong. Please try again." };
  }

  return { step: "code", email };
};

export const verifyEmailOtp = async (
  _state: EmailOtpFormState,
  formData: FormData,
): Promise<EmailOtpFormState> => {
  const emailRaw = formData.get("email");
  const next = formData.get("next");

  if (typeof emailRaw !== "string" || !emailRaw) {
    return { step: "email", error: "Email is required" };
  }

  const parsed = verifyEmailOtpSchema.safeParse({
    email: emailRaw,
    code: formData.get("code"),
  });
  if (!parsed.success) {
    return {
      step: "code",
      email: emailRaw,
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }
  const { email, code } = parsed.data;

  let result;
  try {
    result = await verifyEmailOtpRequest(email, code);
  } catch (err) {
    if (err instanceof ApiError) {
      return { step: "code", email, error: err.message };
    }
    return {
      step: "code",
      email,
      error: "Something went wrong. Please try again.",
    };
  }

  await createWebUserSession({
    user: result.user,
    accessToken: result.accessToken,
    accessTokenExpiresAt: Date.now() + WEB_USER_ACCESS_TOKEN_TTL_MS,
    refreshToken: result.refreshToken,
  });

  const target =
    typeof next === "string" && isSafeRedirectPath(next) ? next : "/account";

  redirect(target);
};
