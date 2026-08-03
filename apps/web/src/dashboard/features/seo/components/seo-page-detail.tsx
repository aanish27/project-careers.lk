"use client";

import { RichTextEditor } from "@/components/tiptap/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UpdateSeoPageInput } from "@careerslk/types";
import { updateSeoPageSchema } from "@careerslk/types";
import {
  IconAlertTriangle,
  IconEyeOff,
  IconRefresh,
  IconRotateClockwise,
} from "@tabler/icons-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import {
  useDeactivateSeoPage,
  useReactivateSeoPage,
  useRegenerateSeoPage,
} from "../hooks/use-seo-page-actions";
import { useSeoPage } from "../hooks/use-seo-pages";
import { useUpdateSeoPage } from "../hooks/use-update-seo-page";

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "—";
}

export function SeoPageDetail({ pageId }: { pageId: number }) {
  const { data: page } = useSeoPage(pageId);
  const updatePage = useUpdateSeoPage();
  const regenerate = useRegenerateSeoPage();
  const deactivate = useDeactivateSeoPage();
  const reactivate = useReactivateSeoPage();

  const form = useForm<UpdateSeoPageInput>({
    resolver: zodResolver(updateSeoPageSchema),
    values: page
      ? {
          title: page.title,
          metaDescription: page.metaDescription,
          h1: page.h1,
          introText: page.introText,
          bottomText: page.bottomText,
          faqJson: page.faqJson ?? [],
          isIndexable: page.isIndexable,
        }
      : undefined,
  });

  const faqArray = useFieldArray({ control: form.control, name: "faqJson" });

  if (!page) return null;

  const onSubmit = form.handleSubmit((values) => {
    updatePage.mutate({ id: page.id, body: values });
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {page.h1}
            <Badge variant="outline">{page.pageType}</Badge>
            <Badge variant={page.isIndexable ? "default" : "outline"}>
              {page.isIndexable ? "Indexable" : "Noindex"}
            </Badge>
            {page.manualOverride && (
              <Badge variant="secondary">Manual override</Badge>
            )}
            {page.needsReview && (
              <Badge variant="destructive">
                <IconAlertTriangle className="size-3" />
                Needs review
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Slug</div>
            <div className="font-mono text-xs">{page.slug}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Jobs / Companies</div>
            <div>
              {page.jobCount} / {page.companyCount}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Content version</div>
            <div>{page.contentVersion}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Last generated</div>
            <div>{formatDate(page.lastGeneratedAt)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Deactivated at</div>
            <div>{formatDate(page.deactivatedAt)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Retired at</div>
            <div>{formatDate(page.retiredAt)}</div>
          </div>
        </CardContent>
      </Card>

      {page.needsReview && page.validationIssues && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <IconAlertTriangle className="size-4" />
              Validation issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm text-destructive">
              {page.validationIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => regenerate.mutate({ id: page.id, force: false })}
            disabled={regenerate.isPending}
          >
            <IconRefresh />
            Regenerate now
          </Button>
          {page.manualOverride && (
            <Button
              variant="outline"
              onClick={() => {
                if (
                  confirm(
                    "This will discard your manual edits and regenerate this page from the template. Continue?",
                  )
                ) {
                  regenerate.mutate({ id: page.id, force: true });
                }
              }}
              disabled={regenerate.isPending}
            >
              <IconRotateClockwise />
              Reset to template
            </Button>
          )}
          {page.isIndexable ? (
            <Button
              variant="destructive"
              onClick={() => deactivate.mutate(page.id)}
              disabled={deactivate.isPending}
            >
              <IconEyeOff />
              Deactivate
            </Button>
          ) : (
            <Button
              onClick={() => reactivate.mutate(page.id)}
              disabled={reactivate.isPending}
            >
              Reactivate
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input id="title" {...form.register("title")} />
              <FieldError errors={[form.formState.errors.title]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="metaDescription">
                Meta description
              </FieldLabel>
              <Textarea
                id="metaDescription"
                rows={2}
                {...form.register("metaDescription")}
              />
              <FieldError errors={[form.formState.errors.metaDescription]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="h1">H1</FieldLabel>
              <Input id="h1" {...form.register("h1")} />
              <FieldError errors={[form.formState.errors.h1]} />
            </Field>

            <Field>
              <FieldLabel>Intro text</FieldLabel>
              <Controller
                control={form.control}
                name="introText"
                render={({ field }) => (
                  <RichTextEditor
                    className="rounded-md border"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>

            <Field>
              <FieldLabel>Bottom text</FieldLabel>
              <Controller
                control={form.control}
                name="bottomText"
                render={({ field }) => (
                  <RichTextEditor
                    className="rounded-md border"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>

            <Field>
              <FieldLabel>FAQ</FieldLabel>
              <div className="flex flex-col gap-3">
                {faqArray.fields.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-md border p-3"
                  >
                    <Input
                      placeholder="Question"
                      {...form.register(`faqJson.${index}.question`)}
                    />
                    <Textarea
                      placeholder="Answer"
                      rows={2}
                      {...form.register(`faqJson.${index}.answer`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="self-end"
                      onClick={() => faqArray.remove(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => faqArray.append({ question: "", answer: "" })}
                >
                  Add question
                </Button>
              </div>
            </Field>

            <Field>
              <div className="flex items-center gap-2">
                <Controller
                  control={form.control}
                  name="isIndexable"
                  render={({ field }) => (
                    <Checkbox
                      id="isIndexable"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                  )}
                />
                <FieldLabel htmlFor="isIndexable">Indexable</FieldLabel>
              </div>
            </Field>

            <Button type="submit" disabled={updatePage.isPending}>
              {updatePage.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
