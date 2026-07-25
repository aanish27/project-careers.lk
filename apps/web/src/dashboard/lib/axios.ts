import axios from "axios";
import type { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { ApiError } from "@dashboard-lib/api-error";

interface ApiSuccessBody<T> {
  success: true;
  data: T;
}

interface ApiErrorBody {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

export const api: AxiosInstance = axios.create({
  baseURL: "/api/server",
  timeout: 15000,
});

api.interceptors.response.use(
  (response: AxiosResponse<ApiSuccessBody<unknown>>) => {
    // The BFF proxy passes the backend's `{success, data, meta}` envelope
    // through unchanged — unwrap it to just `data` so features work with
    // the plain payload.
    (response as AxiosResponse<unknown>).data = response.data.data;

    return response;
  },
  (error: AxiosError<ApiErrorBody>) => {
    const response = error.response;

    // A 401 means the session was already dead when the BFF proxy checked it
    // (refresh happens server-side and had already failed) — there's nothing
    // left to retry client-side, so send the user back to log in.
    if (response?.status === 401 && typeof window !== "undefined") {
      window.location.assign(
        `/admin/login?from=${encodeURIComponent(window.location.pathname)}`,
      );
    }

    if (response?.data?.success === false) {
      const { code, message, details } = response.data.error;
      return Promise.reject(
        new ApiError(response.status, code, message, details),
      );
    }

    return Promise.reject(
      new ApiError(response?.status ?? 0, "NETWORK_ERROR", error.message),
    );
  },
);
