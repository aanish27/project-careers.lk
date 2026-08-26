"use client";

import { getCategoriesForSector, SECTORS } from "@careerslk/types";
import { LocationPicker } from "@components/location-picker";
import { Button } from "@ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ui/field";
import { Input } from "@ui/input";
import { Textarea } from "@ui/textarea";
import { postJob } from "@web-app-features/post-job/api/post-job.actions";
import { useActionState, useState } from "react";

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const WORK_MODES = [
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
];

const selectClassName =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export function PostJobForm({ hasCompany }: { hasCompany: boolean }) {
  const [state, formAction, isPending] = useActionState(postJob, undefined);
  const [sector, setSector] = useState("");
  const roleCategories = getCategoriesForSector(sector || undefined);

  return (
    <form action={formAction}>
      <FieldGroup>
        {!hasCompany && (
          <div className="rounded-md border border-border bg-muted/30 p-4">
            <p className="mb-3 text-sm font-medium">
              First time posting — tell us about your company and we&apos;ll set
              up your company profile from this.
            </p>
            <FieldGroup>
              <Field data-invalid={!!state?.fieldErrors?.name}>
                <FieldLabel htmlFor="companyName" required>
                  Company name
                </FieldLabel>
                <Input
                  id="companyName"
                  name="companyName"
                  required
                  placeholder="Acme Inc."
                  aria-invalid={!!state?.fieldErrors?.name}
                />
                <FieldError>{state?.fieldErrors?.name}</FieldError>
              </Field>
              <Field data-invalid={!!state?.fieldErrors?.websiteUrl}>
                <FieldLabel htmlFor="companyWebsiteUrl">
                  Website URL{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </FieldLabel>
                <Input
                  id="companyWebsiteUrl"
                  name="companyWebsiteUrl"
                  type="url"
                  placeholder="https://example.com"
                  aria-invalid={!!state?.fieldErrors?.websiteUrl}
                />
                <FieldError>{state?.fieldErrors?.websiteUrl}</FieldError>
              </Field>
            </FieldGroup>
          </div>
        )}

        <Field data-invalid={!!state?.fieldErrors?.title}>
          <FieldLabel htmlFor="title" required>
            Job title
          </FieldLabel>
          <Input
            id="title"
            name="title"
            required
            placeholder="Software Engineer"
            aria-invalid={!!state?.fieldErrors?.title}
          />
          <FieldError>{state?.fieldErrors?.title}</FieldError>
        </Field>

        <Field orientation="responsive">
          <LocationPicker />
        </Field>
        {(state?.fieldErrors?.province || state?.fieldErrors?.district) && (
          <FieldError>
            {state.fieldErrors.province ?? state.fieldErrors.district}
          </FieldError>
        )}

        <Field orientation="responsive">
          <Field data-invalid={!!state?.fieldErrors?.workMode}>
            <FieldLabel htmlFor="workMode" required>
              Work mode
            </FieldLabel>
            <select
              id="workMode"
              name="workMode"
              className={selectClassName}
              required
              defaultValue={WORK_MODES[0].value}
              aria-invalid={!!state?.fieldErrors?.workMode}
            >
              {WORK_MODES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError>{state?.fieldErrors?.workMode}</FieldError>
          </Field>
          <Field data-invalid={!!state?.fieldErrors?.employmentType}>
            <FieldLabel htmlFor="employmentType" required>
              Employment type
            </FieldLabel>
            <select
              id="employmentType"
              name="employmentType"
              className={selectClassName}
              required
              defaultValue={EMPLOYMENT_TYPES[0].value}
              aria-invalid={!!state?.fieldErrors?.employmentType}
            >
              {EMPLOYMENT_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError>{state?.fieldErrors?.employmentType}</FieldError>
          </Field>
          <Field data-invalid={!!state?.fieldErrors?.deadline}>
            <FieldLabel htmlFor="deadline">
              Application deadline{" "}
              <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input
              id="deadline"
              name="deadline"
              type="date"
              min={today()}
              aria-invalid={!!state?.fieldErrors?.deadline}
            />
            <FieldError>{state?.fieldErrors?.deadline}</FieldError>
          </Field>
        </Field>

        <Field orientation="responsive">
          <Field>
            <FieldLabel htmlFor="sector">Sector</FieldLabel>
            <select
              id="sector"
              name="sector"
              className={selectClassName}
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            >
              <option value="">Not specified</option>
              {SECTORS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="roleCategory">Role category</FieldLabel>
            <select
              key={sector}
              id="roleCategory"
              name="roleCategory"
              className={selectClassName}
              defaultValue=""
              disabled={roleCategories.length === 0}
            >
              <option value="">
                {roleCategories.length === 0
                  ? "Select a sector first"
                  : "Not specified"}
              </option>
              {roleCategories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </Field>

        <Field orientation="responsive">
          <Field data-invalid={!!state?.fieldErrors?.salaryMin}>
            <FieldLabel htmlFor="salaryMin">
              Salary min{" "}
              <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input
              id="salaryMin"
              name="salaryMin"
              type="number"
              min="0"
              aria-invalid={!!state?.fieldErrors?.salaryMin}
            />
            <FieldError>{state?.fieldErrors?.salaryMin}</FieldError>
          </Field>
          <Field data-invalid={!!state?.fieldErrors?.salaryMax}>
            <FieldLabel htmlFor="salaryMax">
              Salary max{" "}
              <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input
              id="salaryMax"
              name="salaryMax"
              type="number"
              min="0"
              aria-invalid={!!state?.fieldErrors?.salaryMax}
            />
            <FieldError>{state?.fieldErrors?.salaryMax}</FieldError>
          </Field>
          <Field data-invalid={!!state?.fieldErrors?.salaryCurrency}>
            <FieldLabel htmlFor="salaryCurrency">
              Currency{" "}
              <span className="text-muted-foreground">
                (required if salary is set)
              </span>
            </FieldLabel>
            <Input
              id="salaryCurrency"
              name="salaryCurrency"
              placeholder="LKR"
              aria-invalid={!!state?.fieldErrors?.salaryCurrency}
            />
            <FieldError>{state?.fieldErrors?.salaryCurrency}</FieldError>
          </Field>
        </Field>

        <Field data-invalid={!!state?.fieldErrors?.salaryRaw}>
          <FieldLabel htmlFor="salaryRaw">
            Salary (freeform, shown if set)
          </FieldLabel>
          <Input
            id="salaryRaw"
            name="salaryRaw"
            placeholder="e.g. Negotiable"
            aria-invalid={!!state?.fieldErrors?.salaryRaw}
          />
          <FieldError>{state?.fieldErrors?.salaryRaw}</FieldError>
        </Field>

        <Field data-invalid={!!state?.fieldErrors?.description}>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={6}
            aria-invalid={!!state?.fieldErrors?.description}
          />
          <FieldError>{state?.fieldErrors?.description}</FieldError>
        </Field>

        <Field data-invalid={!!state?.fieldErrors?.applyUrl}>
          <FieldLabel htmlFor="applyUrl">Apply URL</FieldLabel>
          <Input
            id="applyUrl"
            name="applyUrl"
            type="url"
            placeholder="https://example.com/apply"
            aria-invalid={!!state?.fieldErrors?.applyUrl}
          />
          <FieldError>{state?.fieldErrors?.applyUrl}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="image">
            Job image <span className="text-muted-foreground">(optional)</span>
          </FieldLabel>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            className="text-sm text-muted-foreground"
          />
        </Field>

        <Field data-invalid={!!state?.error}>
          <FieldError>{state?.error}</FieldError>
          <Button type="submit" disabled={isPending} className="w-10">
            {isPending ? "Submitting…" : "Submit job posting"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
