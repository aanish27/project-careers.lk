"use client";

import { type Company, createWebUserCompanySchema } from "@careerslk/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ui/field";
import { Input } from "@ui/input";
import { Textarea } from "@ui/textarea";
import { startTransition, useActionState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { createCompany, updateCompany } from "../api/company.actions";

export function CompanyForm({ company }: { company?: Company }) {
  const isEdit = !!company;
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateCompany : createCompany,
    undefined,
  );
  const form = useForm<z.infer<typeof createWebUserCompanySchema>>({
    resolver: zodResolver(createWebUserCompanySchema),
    defaultValues: {
      name: company?.name ?? "",
      websiteUrl: company?.websiteUrl ?? "",
      description: company?.description ?? "",
      address: company?.address ?? "",
      contactPerson: company?.contactPerson ?? "",
      contactNumber: company?.contactNumber ?? "",
      linkedinUrl: company?.linkedinUrl ?? "",
      twitterUrl: company?.twitterUrl ?? "",
      facebookUrl: company?.facebookUrl ?? "",
      instagramUrl: company?.instagramUrl ?? "",
    },
  });

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((data) =>
        startTransition(() => formAction(data)),
      )}
    >
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="name" required>
                Company name
              </FieldLabel>
              <Input {...field} id="name" aria-invalid={fieldState.invalid} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="websiteUrl"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="websiteUrl">Website URL</FieldLabel>
              <Input
                {...field}
                id="websiteUrl"
                type="url"
                placeholder="https://example.com"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                {...field}
                id="description"
                rows={4}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="address"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="address">Address</FieldLabel>
              <Input
                {...field}
                id="address"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Field orientation="responsive">
          <Controller
            name="contactPerson"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="contactPerson">Contact person</FieldLabel>
                <Input
                  {...field}
                  id="contactPerson"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            name="contactNumber"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="contactNumber">Contact number</FieldLabel>
                <Input
                  {...field}
                  id="contactNumber"
                  type="tel"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </Field>

        <Field orientation="responsive">
          <Controller
            name="linkedinUrl"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="linkedinUrl">LinkedIn</FieldLabel>
                <Input
                  {...field}
                  id="linkedinUrl"
                  type="url"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            name="twitterUrl"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="twitterUrl">Twitter / X</FieldLabel>
                <Input
                  {...field}
                  id="twitterUrl"
                  type="url"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </Field>

        <Field orientation="responsive">
          <Controller
            name="facebookUrl"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="facebookUrl">Facebook</FieldLabel>
                <Input
                  {...field}
                  id="facebookUrl"
                  type="url"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            name="instagramUrl"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="instagramUrl">Instagram</FieldLabel>
                <Input
                  {...field}
                  id="instagramUrl"
                  type="url"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
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
