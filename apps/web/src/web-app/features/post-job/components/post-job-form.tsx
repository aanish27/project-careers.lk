"use client";

import { MinimalRichTextEditor } from "@/components/tiptap/minimal-rich-text-editor";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCategoriesForSector,
  Sector,
  SECTORS,
  webJobFormSchema,
} from "@careerslk/types";
import { DropzoneField } from "@components/dropzone-field";
import { LocationPicker } from "@components/location-picker";
import { zodResolver } from "@hookform/resolvers/zod";
import { dismissRateLimited } from "@lib/messages";
import { Button } from "@ui/button";
import { Checkbox } from "@ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@ui/field";
import { Input } from "@ui/input";
import { Label } from "@ui/label";
import { postJob } from "@web-app-features/post-job/api/post-job.actions";
import { useRateLimitToast } from "@web-app-lib/use-rate-limit-toast";
import { Activity, startTransition, useActionState, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "talent_pool", label: "Talent pool" },
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const WORK_MODES = [
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
];

const SALARY_PERIODS = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
];

export function PostJobForm({ hasCompany }: { hasCompany: boolean }) {
  const [state, formAction, isPending] = useActionState(postJob, undefined);
  // The "Company profile" section (and its `name` field) only renders when
  // `!hasCompany` — a poster who already has one never sees it, so `name`
  // must not stay required in that case or the form is permanently invalid.
  const formSchema = hasCompany
    ? webJobFormSchema.extend({ name: z.string().optional() })
    : webJobFormSchema;
  const form = useForm<z.infer<typeof webJobFormSchema>>({
    // Cast is safe: `name` is always a string at runtime regardless of
    // branch (defaultValues seeds "", and the field only ever mutates via
    // the Controller that's rendered when `!hasCompany`) — only the
    // validation strictness differs between the two schema variants.
    resolver: zodResolver(formSchema as typeof webJobFormSchema),
    defaultValues: {
      name: "",
      websiteUrl: "",
      title: "",
      province: "",
      district: "",
      city: "",
      workMode: "onsite",
      employmentType: "full_time",
      sector: "",
      roleCategory: "",
      salaryMin: undefined,
      salaryMax: undefined,
      salaryCurrency: "",
      salaryPeriod: "annual",
      salaryRaw: "",
      description: "",
      deadline: "",
      applyUrl: "",
      cvEmail: "",
      walkIn: false,
      image: undefined,
    },
  });

  useRateLimitToast(state?.error);
  const [sector, setSector] = useState<Sector | undefined>(undefined);
  const roleCategories = getCategoriesForSector(sector || undefined);
  const [isRemote, setIsRemote] = useState<boolean | undefined>(undefined);
  const [salaryMode, setSalaryMode] = useState<"range" | "freeform">("range");

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(
        (data) => startTransition(() => formAction(data)),
        (errors) => console.error("Post job form validation errors:", errors),
      )}
    >
      <FieldGroup>
        {!hasCompany && (
          <FieldSet className="rounded-md border border-border bg-muted/30 p-4">
            <FieldLegend>Company profile</FieldLegend>
            <FieldDescription>
              First time posting — tell us about your company and we&apos;ll set
              up your company profile from this.
            </FieldDescription>
            <Field orientation="responsive">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="name" required>
                      Company name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="name"
                      name="name"
                      aria-invalid={fieldState.invalid}
                      placeholder="Acme Inc."
                      autoComplete="off"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="websiteUrl"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="websiteUrl">
                      Website URL{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="websiteUrl"
                      name="websiteUrl"
                      type="url"
                      aria-invalid={fieldState.invalid}
                      placeholder="https://example.com"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </Field>
          </FieldSet>
        )}

        <FieldSet>
          <FieldLegend>Job details</FieldLegend>

          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="title" required>
                  Job title
                </FieldLabel>
                <Input
                  {...field}
                  id="title"
                  name="title"
                  aria-invalid={fieldState.invalid}
                  placeholder="Software Engineer"
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Field orientation="responsive">
            <Controller
              name="workMode"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="workMode" required>
                    Work mode
                  </FieldLabel>
                  <Select
                    name="workMode"
                    required
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setIsRemote(value === "remote");
                    }}
                  >
                    <SelectTrigger
                      id="workMode"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {WORK_MODES.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="employmentType"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="employmentType" required>
                    Employment type
                  </FieldLabel>
                  <Select
                    name="employmentType"
                    required
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="employmentType"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {EMPLOYMENT_TYPES.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="deadline"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="deadline">
                    Application deadline{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="deadline"
                    name="deadline"
                    type="date"
                    min={today()}
                    // The native date input only speaks "YYYY-MM-DD", but
                    // the schema (and the API's DateTime column) need a
                    // full ISO datetime — convert at this boundary rather
                    // than loosening the schema.
                    value={field.value ? field.value.slice(0, 10) : ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(
                        value ? new Date(value).toISOString() : "",
                      );
                    }}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </Field>

          <Field orientation="responsive">
            <Controller
              name="sector"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sector" required>
                    Sector
                  </FieldLabel>
                  <Select
                    name="sector"
                    required
                    value={field.value || null}
                    onValueChange={(value: string | null) => {
                      field.onChange(value ?? "");
                      setSector((value as Sector | null) ?? undefined);
                    }}
                  >
                    <SelectTrigger
                      id="sector"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent className="min-w-72">
                      <SelectGroup>
                        {SECTORS.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="roleCategory"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="roleCategory" required>
                    Role category
                  </FieldLabel>
                  <Select
                    name="roleCategory"
                    disabled={roleCategories.length === 0}
                    required
                    value={field.value || null}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="roleCategory"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue
                        placeholder={`${
                          roleCategories.length === 0
                            ? "Select a sector first"
                            : "Not specified"
                        }`}
                      />
                    </SelectTrigger>
                    <SelectContent className="min-w-72">
                      <SelectGroup>
                        {roleCategories.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </Field>
          <Activity mode={!isRemote ? "visible" : "hidden"}>
            <Field>
              <LocationPicker control={form.control} disabled={isPending} />
            </Field>
          </Activity>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Compensation</FieldLegend>
          <FieldDescription>
            Optional — choose a numeric range or freeform text, not both.
          </FieldDescription>

          <Field orientation="responsive">
            <Field>
              <FieldLabel htmlFor="salaryMode">Salary</FieldLabel>
              <Select
                id="salaryMode"
                value={salaryMode}
                onValueChange={(value) =>
                  setSalaryMode(value === "freeform" ? "freeform" : "range")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="range">Salary range</SelectItem>
                    <SelectItem value="freeform">Freeform text</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Controller
              name="salaryCurrency"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="salaryCurrency">
                    Currency{" "}
                    <span className="text-muted-foreground">
                      (required if salary is set)
                    </span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="salaryCurrency"
                    name="salaryCurrency"
                    placeholder="LKR"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="salaryPeriod"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="salaryPeriod">
                    Period{" "}
                    <span className="text-muted-foreground">
                      (required if salary is set)
                    </span>
                  </FieldLabel>
                  <Select
                    name="salaryPeriod"
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="salaryPeriod"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {SALARY_PERIODS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </Field>

          {salaryMode === "range" ? (
            <Field orientation="responsive">
              <Controller
                name="salaryMin"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="salaryMin">
                      Salary min{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </FieldLabel>
                    <Input
                      id="salaryMin"
                      name="salaryMin"
                      type="number"
                      min="0"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                      onBlur={field.onBlur}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="salaryMax"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="salaryMax">
                      Salary max{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </FieldLabel>
                    <Input
                      id="salaryMax"
                      name="salaryMax"
                      type="number"
                      min="0"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                      onBlur={field.onBlur}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </Field>
          ) : (
            <Controller
              name="salaryRaw"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="salaryRaw">Salary text</FieldLabel>
                  <Input
                    {...field}
                    id="salaryRaw"
                    name="salaryRaw"
                    placeholder="e.g. Negotiable"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          )}
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Description</FieldLegend>
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel required>Job description</FieldLabel>
                <input type="hidden" name="description" value={field.value} />
                <MinimalRichTextEditor
                  placeholder="Describe the role, responsibilities, and requirements"
                  value={field.value}
                  onChange={field.onChange}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>How to apply</FieldLegend>

          <Controller
            name="walkIn"
            control={form.control}
            render={({ field: walkInField }) => (
              <Field>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="walkIn"
                    checked={walkInField.value ?? false}
                    onCheckedChange={(checked) =>
                      walkInField.onChange(checked === true)
                    }
                  />
                  <Label htmlFor="walkIn">
                    This is a walk-in role — candidates apply in person
                  </Label>
                </div>
                {walkInField.value && (
                  <input type="hidden" name="walkIn" value="on" />
                )}

                <Activity mode={!walkInField.value ? "visible" : "hidden"}>
                  <Field orientation="responsive">
                    <Controller
                      name="applyUrl"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="applyUrl">
                            Apply URL{" "}
                            <span className="text-muted-foreground">
                              (optional)
                            </span>
                          </FieldLabel>
                          <Input
                            {...field}
                            id="applyUrl"
                            name="applyUrl"
                            type="url"
                            placeholder="https://example.com/apply"
                            aria-invalid={fieldState.invalid}
                          />
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                    <Controller
                      name="cvEmail"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="cvEmail">
                            CV email{" "}
                            <span className="text-muted-foreground">
                              (optional)
                            </span>
                          </FieldLabel>
                          <Input
                            {...field}
                            id="cvEmail"
                            name="cvEmail"
                            type="email"
                            placeholder="jobs@example.com"
                            aria-invalid={fieldState.invalid}
                          />
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </Field>
                </Activity>
              </Field>
            )}
          />
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Media</FieldLegend>
          <Field>
            <FieldLabel htmlFor="image">
              Job image{" "}
              <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <DropzoneField
              control={form.control}
              name="image"
              accept={{ "image/*": [] }}
              maxSize={5 * 1024 * 1024}
              disabled={isPending}
              uploading={isPending}
              placeholder="Drag a job image here, or click to browse"
            />
          </Field>
        </FieldSet>

        <Field data-invalid={!!dismissRateLimited(state?.error)}>
          <FieldError>{dismissRateLimited(state?.error)}</FieldError>
          <Button type="submit" disabled={isPending} className="w-10">
            {isPending ? "Submitting…" : "Submit job posting"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
