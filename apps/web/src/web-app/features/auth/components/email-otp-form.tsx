"use client";

import { useActionState } from "react";
import { Button } from "@ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ui/field";
import { Input } from "@ui/input";
import {
  requestEmailOtp,
  verifyEmailOtp,
} from "@web-app-features/auth/api/web-user-auth.actions";

export function EmailOtpForm({ next }: { next?: string }) {
  const [requestState, requestAction, requesting] = useActionState(
    requestEmailOtp,
    undefined,
  );
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyEmailOtp,
    undefined,
  );

  const step = verifyState?.step ?? requestState?.step ?? "email";
  const email =
    verifyState?.step === "code"
      ? verifyState.email
      : requestState?.step === "code"
        ? requestState.email
        : undefined;

  if (step === "code" && email) {
    return (
      <form action={verifyAction}>
        <FieldGroup>
          <input type="hidden" name="email" value={email} />
          {next && <input type="hidden" name="next" value={next} />}
          <Field
            data-invalid={
              !!verifyState?.error || !!verifyState?.fieldErrors?.code
            }
          >
            <FieldLabel htmlFor="code">
              Enter the code sent to {email}
            </FieldLabel>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="123456"
              aria-invalid={
                !!verifyState?.error || !!verifyState?.fieldErrors?.code
              }
              required
              autoFocus
            />
            <FieldError>
              {verifyState?.error ?? verifyState?.fieldErrors?.code}
            </FieldError>
          </Field>
          <Field>
            <Button type="submit" disabled={verifying}>
              {verifying ? "Verifying…" : "Verify code"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    );
  }

  return (
    <form action={requestAction}>
      <FieldGroup>
        {next && <input type="hidden" name="next" value={next} />}
        <Field
          data-invalid={
            !!requestState?.error || !!requestState?.fieldErrors?.email
          }
        >
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            aria-invalid={
              !!requestState?.error || !!requestState?.fieldErrors?.email
            }
            required
          />
          <FieldError>
            {requestState?.error ?? requestState?.fieldErrors?.email}
          </FieldError>
        </Field>
        <Field>
          <Button type="submit" variant="outline" disabled={requesting}>
            {requesting ? "Sending…" : "Continue with email"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
