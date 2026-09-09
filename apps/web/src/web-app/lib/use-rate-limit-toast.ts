"use client";

import { RATE_LIMIT_MESSAGE } from "@lib/messages";
import { useEffect } from "react";
import { toast } from "sonner";

// Server Actions surface a rate limit as this exact error string (see
// toActionErrorMessage in @lib/api-client). Forms already render `error`
// inline for validation-style failures, but a rate limit isn't something
// the user did wrong on this field — it reads better as a toast than as
// red text sitting under an input.
export function useRateLimitToast(error: string | undefined) {
  useEffect(() => {
    if (error === RATE_LIMIT_MESSAGE) toast.error(error);
  }, [error]);
}
