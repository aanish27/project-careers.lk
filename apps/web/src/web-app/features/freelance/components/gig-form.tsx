"use client";

import { FREELANCE_CATEGORIES } from "@careerslk/types";
import { Button } from "@ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ui/field";
import { Input } from "@ui/input";
import { Textarea } from "@ui/textarea";
import { dismissRateLimited } from "@lib/messages";
import { useRateLimitToast } from "@web-app-lib/use-rate-limit-toast";
import { useActionState } from "react";
import { submitGig } from "../api/freelance.actions";

export function GigForm() {
  const [state, formAction, isPending] = useActionState(submitGig, undefined);

  useRateLimitToast(state?.error);

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field data-invalid={!!state?.fieldErrors?.title}>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input
            id="title"
            name="title"
            required
            placeholder="e.g. Build a landing page"
            aria-invalid={!!state?.fieldErrors?.title}
          />
          <FieldError>{state?.fieldErrors?.title}</FieldError>
        </Field>

        <Field data-invalid={!!state?.fieldErrors?.description}>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={5}
            placeholder="Describe the work you need done"
            aria-invalid={!!state?.fieldErrors?.description}
          />
          <FieldError>{state?.fieldErrors?.description}</FieldError>
        </Field>

        <Field orientation="responsive">
          <Field data-invalid={!!state?.fieldErrors?.category}>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <select
              id="category"
              name="category"
              defaultValue=""
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              aria-invalid={!!state?.fieldErrors?.category}
            >
              <option value="">Select a category</option>
              {FREELANCE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <FieldError>{state?.fieldErrors?.category}</FieldError>
          </Field>
          <Field data-invalid={!!state?.fieldErrors?.skills}>
            <FieldLabel htmlFor="skills">Skills</FieldLabel>
            <Input
              id="skills"
              name="skills"
              placeholder="Comma-separated, e.g. React, Figma"
              aria-invalid={!!state?.fieldErrors?.skills}
            />
            <FieldError>{state?.fieldErrors?.skills}</FieldError>
          </Field>
        </Field>

        <Field orientation="responsive">
          <Field data-invalid={!!state?.fieldErrors?.budgetMin}>
            <FieldLabel htmlFor="budgetMin">Budget min</FieldLabel>
            <Input
              id="budgetMin"
              name="budgetMin"
              type="number"
              min={0}
              aria-invalid={!!state?.fieldErrors?.budgetMin}
            />
            <FieldError>{state?.fieldErrors?.budgetMin}</FieldError>
          </Field>
          <Field data-invalid={!!state?.fieldErrors?.budgetMax}>
            <FieldLabel htmlFor="budgetMax">Budget max</FieldLabel>
            <Input
              id="budgetMax"
              name="budgetMax"
              type="number"
              min={0}
              aria-invalid={!!state?.fieldErrors?.budgetMax}
            />
            <FieldError>{state?.fieldErrors?.budgetMax}</FieldError>
          </Field>
          <Field data-invalid={!!state?.fieldErrors?.budgetCurrency}>
            <FieldLabel htmlFor="budgetCurrency">Currency</FieldLabel>
            <Input
              id="budgetCurrency"
              name="budgetCurrency"
              defaultValue="LKR"
              className="w-24"
              aria-invalid={!!state?.fieldErrors?.budgetCurrency}
            />
            <FieldError>{state?.fieldErrors?.budgetCurrency}</FieldError>
          </Field>
        </Field>

        <Field data-invalid={!!dismissRateLimited(state?.error)}>
          <FieldError>{dismissRateLimited(state?.error)}</FieldError>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Submitting…" : "Submit gig"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
