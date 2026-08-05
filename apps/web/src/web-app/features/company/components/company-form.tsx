"use client";

import type { Company } from "@careerslk/types";
import { Button } from "@ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ui/field";
import { Input } from "@ui/input";
import { Textarea } from "@ui/textarea";
import { useActionState } from "react";
import { createCompany, updateCompany } from "../api/company.actions";

export function CompanyForm({ company }: { company?: Company }) {
  const isEdit = !!company;
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateCompany : createCompany,
    undefined,
  );

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Company name</FieldLabel>
          <Input id="name" name="name" required defaultValue={company?.name} />
        </Field>

        {!isEdit && (
          <Field>
            <FieldLabel htmlFor="websiteUrl">
              Website URL{" "}
              <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              placeholder="https://example.com"
            />
          </Field>
        )}

        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={company?.description ?? undefined}
          />
        </Field>

        <Field orientation="responsive">
          <Field>
            <FieldLabel htmlFor="linkedinUrl">LinkedIn</FieldLabel>
            <Input
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              defaultValue={company?.linkedinUrl ?? undefined}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="twitterUrl">Twitter / X</FieldLabel>
            <Input
              id="twitterUrl"
              name="twitterUrl"
              type="url"
              defaultValue={company?.twitterUrl ?? undefined}
            />
          </Field>
        </Field>

        <Field orientation="responsive">
          <Field>
            <FieldLabel htmlFor="facebookUrl">Facebook</FieldLabel>
            <Input
              id="facebookUrl"
              name="facebookUrl"
              type="url"
              defaultValue={company?.facebookUrl ?? undefined}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="instagramUrl">Instagram</FieldLabel>
            <Input
              id="instagramUrl"
              name="instagramUrl"
              type="url"
              defaultValue={company?.instagramUrl ?? undefined}
            />
          </Field>
        </Field>

        <Field data-invalid={!!state?.error}>
          <FieldError>{state?.error}</FieldError>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : isEdit ? "Save changes" : "Create company"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
