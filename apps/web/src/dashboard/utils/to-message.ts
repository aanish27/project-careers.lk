import { ApiError } from "../lib/api-error";

export const toMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;
