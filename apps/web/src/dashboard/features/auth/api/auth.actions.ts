'use server';

import { redirect } from 'next/navigation';
import { ApiError, loginRequest, logoutRequest } from '@lib/api-client';
import { ACCESS_TOKEN_TTL_MS } from '@dashboard-config/constants';
import {
  createSession,
  destroySession,
  getValidAccessToken,
} from '@dashboard-lib/session';
import { isSafeRedirectPath } from '@utils/utils';

export type LoginFormState =
  | { error?: string; fieldErrors?: { email?: string; password?: string } }
  | undefined;

const mapValidationDetailsToFieldErrors = (
  details: unknown,
): { email?: string; password?: string } | undefined => {
  if (!Array.isArray(details)) return undefined;

  const fieldErrors: { email?: string; password?: string } = {};
  for (const message of details) {
    if (typeof message !== 'string') continue;
    if (message.startsWith('email') && !fieldErrors.email) {
      fieldErrors.email = message;
    } else if (message.startsWith('password') && !fieldErrors.password) {
      fieldErrors.password = message;
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
};

export const login = async (
  _state: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> => {
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || !email) {
    return { fieldErrors: { email: 'Email is required' } };
  }
  if (typeof password !== 'string' || !password) {
    return { fieldErrors: { password: 'Password is required' } };
  }

  let user, accessToken: string, refreshToken: string;
  try {
    ({ user, accessToken, refreshToken } = await loginRequest(email, password));
  } catch (err) {
    if (!(err instanceof ApiError)) {
      return { error: 'Something went wrong. Please try again.' };
    }

    if (err.status === 401) {
      return { error: err.message };
    }
    if (err.status === 429) {
      return {
        error: 'Too many login attempts. Please wait a minute and try again.',
      };
    }
    if (err.status === 400) {
      const fieldErrors = mapValidationDetailsToFieldErrors(err.details);
      return fieldErrors ? { fieldErrors } : { error: err.message };
    }
    return { error: 'Something went wrong. Please try again.' };
  }

  await createSession({
    user,
    accessToken,
    accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
    refreshToken,
  });

  const from = formData.get('from');
  const target =
    typeof from === 'string' && isSafeRedirectPath(from) ? from : '/admin';

  redirect(target);
};

export const logout = async (): Promise<void> => {
  const accessToken = await getValidAccessToken();

  if (accessToken) {
    await logoutRequest(accessToken).catch(() => {});
  }

  await destroySession();
  redirect('/admin/login');
};
