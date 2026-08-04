"use client";

import { useActionState } from "react";
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
  { value: "freelance", label: "Freelance" },
];

const WORK_MODES = [
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
];

const selectClassName =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export function PostJobForm() {
  const [state, formAction, isPending] = useActionState(postJob, undefined);

  return (
    <form action={formAction}>
      <FieldGroup>
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
          <Field>
            <FieldLabel htmlFor="location">Location</FieldLabel>
            <Input
              id="location"
              name="location"
              placeholder="Colombo, Sri Lanka"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="workMode">Work mode</FieldLabel>
            <select
              id="workMode"
              name="workMode"
              className={selectClassName}
              defaultValue=""
            >
              <option value="">Not specified</option>
              {WORK_MODES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </Field>

        <Field orientation="responsive">
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
            <Input id="sector" name="sector" placeholder="Software & IT" />
          </Field>
          <Field>
            <FieldLabel htmlFor="roleCategory">Role category</FieldLabel>
            <Input
              id="roleCategory"
              name="roleCategory"
              placeholder="Engineering"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="department">Department</FieldLabel>
            <Input id="department" name="department" placeholder="Product" />
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
