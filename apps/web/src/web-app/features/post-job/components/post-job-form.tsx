"use client";

import { getCategoriesForSector, SECTORS } from "@careerslk/types";
import { LocationPicker } from "@components/location-picker";
import { useActionState, useState } from "react";
import { Button } from "@ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@ui/field";
import { Input } from "@ui/input";
import { Textarea } from "@ui/textarea";
import { postJob } from "@web-app-features/post-job/api/post-job.actions";

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

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
              <Field>
                <FieldLabel htmlFor="companyName">Company name</FieldLabel>
                <Input
                  id="companyName"
                  name="companyName"
                  required
                  placeholder="Acme Inc."
                />
              </Field>
              <Field orientation="responsive">
                <Field>
                  <FieldLabel htmlFor="companyWebsiteUrl">
                    Website URL{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input
                    id="companyWebsiteUrl"
                    name="companyWebsiteUrl"
                    type="url"
                    placeholder="https://example.com"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="companyCareerUrl">
                    Career page URL{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input
                    id="companyCareerUrl"
                    name="companyCareerUrl"
                    type="url"
                    placeholder="https://example.com/careers"
                  />
                </Field>
              </Field>
            </FieldGroup>
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="title">Job title</FieldLabel>
          <Input
            id="title"
            name="title"
            required
            placeholder="Software Engineer"
          />
        </Field>

        <Field orientation="responsive">
          <LocationPicker />
        </Field>

        <Field orientation="responsive">
          <Field>
            <FieldLabel htmlFor="workMode">Work mode</FieldLabel>
            <select
              id="workMode"
              name="workMode"
              className={selectClassName}
              required
              defaultValue={WORK_MODES[0].value}
            >
              {WORK_MODES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="employmentType">Employment type</FieldLabel>
            <select
              id="employmentType"
              name="employmentType"
              className={selectClassName}
              defaultValue=""
            >
              <option value="">Not specified</option>
              {EMPLOYMENT_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="deadline">Application deadline</FieldLabel>
            <Input id="deadline" name="deadline" type="date" />
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
              <option value="">Not specified</option>
              {roleCategories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </Field>

        <Field orientation="responsive">
          <Field>
            <FieldLabel htmlFor="salaryMin">Salary min</FieldLabel>
            <Input id="salaryMin" name="salaryMin" type="number" min="0" />
          </Field>
          <Field>
            <FieldLabel htmlFor="salaryMax">Salary max</FieldLabel>
            <Input id="salaryMax" name="salaryMax" type="number" min="0" />
          </Field>
          <Field>
            <FieldLabel htmlFor="salaryCurrency">Currency</FieldLabel>
            <Input
              id="salaryCurrency"
              name="salaryCurrency"
              placeholder="LKR"
            />
          </Field>
        </Field>

        <Field>
          <FieldLabel htmlFor="salaryRaw">
            Salary (freeform, shown if set)
          </FieldLabel>
          <Input
            id="salaryRaw"
            name="salaryRaw"
            placeholder="e.g. Negotiable"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea id="description" name="description" rows={6} />
        </Field>

        <Field>
          <FieldLabel htmlFor="applyUrl">Apply URL</FieldLabel>
          <Input
            id="applyUrl"
            name="applyUrl"
            type="url"
            placeholder="https://example.com/apply"
          />
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
          <Button type="submit" disabled={isPending}>
            {isPending ? "Submitting…" : "Submit job posting"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
