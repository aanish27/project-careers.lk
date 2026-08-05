"use client";

import type { FreelanceProfile } from "@careerslk/types";
import { FREELANCE_CATEGORIES } from "@careerslk/types";
import { Button } from "@ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ui/field";
import { Input } from "@ui/input";
import { Textarea } from "@ui/textarea";
import { useActionState } from "react";
import {
  createFreelanceProfile,
  updateFreelanceProfile,
} from "../api/freelance.actions";

export function FreelancerProfileForm({
  profile,
}: {
  profile?: FreelanceProfile | null;
}) {
  const isEdit = !!profile;
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateFreelanceProfile : createFreelanceProfile,
    undefined,
  );

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field data-invalid={!!state?.fieldErrors?.bio}>
          <FieldLabel htmlFor="bio">Bio</FieldLabel>
          <Textarea
            id="bio"
            name="bio"
            rows={5}
            defaultValue={profile?.bio ?? undefined}
            placeholder="Tell clients what you do and how you can help"
            aria-invalid={!!state?.fieldErrors?.bio}
          />
          <FieldError>{state?.fieldErrors?.bio}</FieldError>
        </Field>

        <Field orientation="responsive">
          <Field data-invalid={!!state?.fieldErrors?.category}>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <select
              id="category"
              name="category"
              defaultValue={profile?.category ?? ""}
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
          <Field data-invalid={!!state?.fieldErrors?.rate}>
            <FieldLabel htmlFor="rate">Rate</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="rate"
                name="rate"
                type="number"
                min={0}
                defaultValue={profile?.rate ?? undefined}
                placeholder="e.g. 5000"
                aria-invalid={!!state?.fieldErrors?.rate}
              />
              <Input
                name="rateCurrency"
                defaultValue={profile?.rateCurrency ?? "LKR"}
                className="w-24"
              />
            </div>
            <FieldError>{state?.fieldErrors?.rate}</FieldError>
          </Field>
        </Field>

        <Field data-invalid={!!state?.fieldErrors?.skills}>
          <FieldLabel htmlFor="skills">Skills</FieldLabel>
          <Input
            id="skills"
            name="skills"
            defaultValue={profile?.skills.join(", ")}
            placeholder="Comma-separated, e.g. React, Figma, Copywriting"
            aria-invalid={!!state?.fieldErrors?.skills}
          />
          <FieldError>{state?.fieldErrors?.skills}</FieldError>
        </Field>

        <Field data-invalid={!!state?.fieldErrors?.portfolioLinks}>
          <FieldLabel htmlFor="portfolioLinks">Portfolio links</FieldLabel>
          <Input
            id="portfolioLinks"
            name="portfolioLinks"
            defaultValue={profile?.portfolioLinks.join(", ")}
            placeholder="Comma-separated URLs"
            aria-invalid={!!state?.fieldErrors?.portfolioLinks}
          />
          <FieldError>{state?.fieldErrors?.portfolioLinks}</FieldError>
        </Field>

        <Field data-invalid={!!state?.error}>
          <FieldError>{state?.error}</FieldError>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Create freelance profile"}
          </Button>
        </Field>

        {isEdit && profile?.approvalStatus === "PENDING" && (
          <p className="text-muted-foreground text-sm">
            Your profile is awaiting admin approval. It won&apos;t be publicly
            listed until then.
          </p>
        )}
        {isEdit && profile?.approvalStatus === "REJECTED" && (
          <p className="text-destructive text-sm">
            Your profile was rejected
            {profile.rejectionReason
              ? `: ${profile.rejectionReason}`
              : "."}{" "}
            Edit and resubmit for review.
          </p>
        )}
      </FieldGroup>
    </form>
  );
}
