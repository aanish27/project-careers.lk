"use client";

import { FREELANCE_CATEGORIES } from "@careerslk/types";
import { Button } from "@ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ui/field";
import { Input } from "@ui/input";
import { Textarea } from "@ui/textarea";
import { useActionState } from "react";
import { submitGig } from "../api/freelance.actions";

export function GigForm() {
  const [state, formAction, isPending] = useActionState(submitGig, undefined);

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input
            id="title"
            name="title"
            required
            placeholder="e.g. Build a landing page"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={5}
            placeholder="Describe the work you need done"
          />
        </Field>

        <Field orientation="responsive">
          <Field>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <select
              id="category"
              name="category"
              defaultValue=""
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            >
              <option value="">Select a category</option>
              {FREELANCE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="skills">Skills</FieldLabel>
            <Input
              id="skills"
              name="skills"
              placeholder="Comma-separated, e.g. React, Figma"
            />
          </Field>
        </Field>

        <Field orientation="responsive">
          <Field>
            <FieldLabel htmlFor="budgetMin">Budget min</FieldLabel>
            <Input id="budgetMin" name="budgetMin" type="number" min={0} />
          </Field>
          <Field>
            <FieldLabel htmlFor="budgetMax">Budget max</FieldLabel>
            <Input id="budgetMax" name="budgetMax" type="number" min={0} />
          </Field>
          <Field>
            <FieldLabel htmlFor="budgetCurrency">Currency</FieldLabel>
            <Input
              id="budgetCurrency"
              name="budgetCurrency"
              defaultValue="LKR"
              className="w-24"
            />
          </Field>
        </Field>

        <Field data-invalid={!!state?.error}>
          <FieldError>{state?.error}</FieldError>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Submitting…" : "Submit gig"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
