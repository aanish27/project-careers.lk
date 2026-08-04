"use client";

import { updateProfile } from "@web-app-features/auth/api/profile.actions";
import { Button } from "@ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ui/field";
import { Input } from "@ui/input";
import { useActionState } from "react";

export function ProfileNameForm({
  firstName,
  lastName,
}: {
  firstName: string | null;
  lastName: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    undefined,
  );

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field orientation="responsive">
          <Field>
            <FieldLabel htmlFor="firstName">First name</FieldLabel>
            <Input
              id="firstName"
              name="firstName"
              defaultValue={firstName ?? ""}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="lastName">Last name</FieldLabel>
            <Input
              id="lastName"
              name="lastName"
              defaultValue={lastName ?? ""}
            />
          </Field>
        </Field>
        <Field data-invalid={!!state?.error}>
          <FieldError>{state?.error}</FieldError>
          <Button type="submit" variant="outline" disabled={isPending}>
            {isPending ? "Saving…" : "Save name"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
