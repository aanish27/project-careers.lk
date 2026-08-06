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
        <Field data-invalid={!!state?.fieldErrors?.name}>
          <FieldLabel htmlFor="name">Company name</FieldLabel>
          <Input
            id="name"
            name="name"
            required
            defaultValue={company?.name}
            aria-invalid={!!state?.fieldErrors?.name}
          />
          <FieldError>{state?.fieldErrors?.name}</FieldError>
        </Field>

        <Field data-invalid={!!state?.fieldErrors?.websiteUrl}>
          <FieldLabel htmlFor="websiteUrl">
            Website URL{" "}
            <span className="text-muted-foreground">(optional)</span>
          </FieldLabel>
          <Input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            placeholder="https://example.com"
            defaultValue={company?.websiteUrl ?? undefined}
            aria-invalid={!!state?.fieldErrors?.websiteUrl}
          />
          <FieldError>{state?.fieldErrors?.websiteUrl}</FieldError>
        </Field>

        <Field data-invalid={!!state?.fieldErrors?.description}>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={company?.description ?? undefined}
            aria-invalid={!!state?.fieldErrors?.description}
          />
          <FieldError>{state?.fieldErrors?.description}</FieldError>
        </Field>

        <Field orientation="responsive">
          <Field data-invalid={!!state?.fieldErrors?.linkedinUrl}>
            <FieldLabel htmlFor="linkedinUrl">LinkedIn</FieldLabel>
            <Input
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              defaultValue={company?.linkedinUrl ?? undefined}
              aria-invalid={!!state?.fieldErrors?.linkedinUrl}
            />
            <FieldError>{state?.fieldErrors?.linkedinUrl}</FieldError>
          </Field>
          <Field data-invalid={!!state?.fieldErrors?.twitterUrl}>
            <FieldLabel htmlFor="twitterUrl">Twitter / X</FieldLabel>
            <Input
              id="twitterUrl"
              name="twitterUrl"
              type="url"
              defaultValue={company?.twitterUrl ?? undefined}
              aria-invalid={!!state?.fieldErrors?.twitterUrl}
            />
            <FieldError>{state?.fieldErrors?.twitterUrl}</FieldError>
          </Field>
        </Field>

        <Field orientation="responsive">
          <Field data-invalid={!!state?.fieldErrors?.facebookUrl}>
            <FieldLabel htmlFor="facebookUrl">Facebook</FieldLabel>
            <Input
              id="facebookUrl"
              name="facebookUrl"
              type="url"
              defaultValue={company?.facebookUrl ?? undefined}
              aria-invalid={!!state?.fieldErrors?.facebookUrl}
            />
            <FieldError>{state?.fieldErrors?.facebookUrl}</FieldError>
          </Field>
          <Field data-invalid={!!state?.fieldErrors?.instagramUrl}>
            <FieldLabel htmlFor="instagramUrl">Instagram</FieldLabel>
            <Input
              id="instagramUrl"
              name="instagramUrl"
              type="url"
              defaultValue={company?.instagramUrl ?? undefined}
              aria-invalid={!!state?.fieldErrors?.instagramUrl}
            />
            <FieldError>{state?.fieldErrors?.instagramUrl}</FieldError>
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
