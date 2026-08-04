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
        <Field>
          <FieldLabel htmlFor="bio">Bio</FieldLabel>
          <Textarea
            id="bio"
            name="bio"
            rows={5}
            defaultValue={profile?.bio ?? undefined}
            placeholder="Tell clients what you do and how you can help"
          />
        </Field>

        <Field orientation="responsive">
          <Field>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <select
              id="category"
              name="category"
              defaultValue={profile?.category ?? ""}
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
            <FieldLabel htmlFor="rate">Rate</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="rate"
                name="rate"
                type="number"
                min={0}
                defaultValue={profile?.rate ?? undefined}
                placeholder="e.g. 5000"
              />
              <Input
                name="rateCurrency"
                defaultValue={profile?.rateCurrency ?? "LKR"}
                className="w-24"
              />
            </div>
          </Field>
        </Field>

        <Field>
          <FieldLabel htmlFor="skills">Skills</FieldLabel>
          <Input
            id="skills"
            name="skills"
            defaultValue={profile?.skills.join(", ")}
            placeholder="Comma-separated, e.g. React, Figma, Copywriting"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="portfolioLinks">Portfolio links</FieldLabel>
          <Input
            id="portfolioLinks"
            name="portfolioLinks"
            defaultValue={profile?.portfolioLinks.join(", ")}
            placeholder="Comma-separated URLs"
          />
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
