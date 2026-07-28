"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Company, CreateCompanyInput } from "@careerslk/types";
import { CompanyStatus, createCompanySchema } from "@careerslk/types";
import { useCreateCompany } from "../hooks/use-create-company";
import { useUpdateCompany } from "../hooks/use-update-company";

// Native inputs yield "" when cleared, but these fields are optional URLs/
// strings whose Zod schema only accepts a real value or undefined — treat an
// emptied field as "not provided" rather than an invalid value.
const emptyToUndefined = (value: string) => (value === "" ? undefined : value);

interface CompanyFormDialogProps {
  company?: Company;
  /** Omit when controlling visibility externally (e.g. from a dropdown item) via `open`/`onOpenChange`. */
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CompanyFormDialog({
  company,
  children,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: CompanyFormDialogProps) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChangeProp ?? setOpenState;
  const isEdit = !!company;
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const isPending = createCompany.isPending || updateCompany.isPending;

  const form = useForm<CreateCompanyInput>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: company?.name ?? "",
      websiteUrl: company?.websiteUrl ?? "",
      careerUrl: company?.careerUrl ?? "",
      status: company?.status ?? CompanyStatus.ACTIVE,
      atsPlatform: company?.atsPlatform ?? "",
      logoUrl: company?.logoUrl ?? "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    if (isEdit) {
      updateCompany.mutate(
        { id: company.id, body: values },
        { onSuccess: () => setOpen(false) },
      );
    } else {
      createCompany.mutate(values, {
        onSuccess: () => {
          setOpen(false);
          form.reset();
        },
      });
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      {children && <DialogTrigger render={children as React.ReactElement} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit ${company.name}` : "Add company"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" {...form.register("name")} />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="websiteUrl">Website URL</FieldLabel>
            <Input id="websiteUrl" {...form.register("websiteUrl")} />
            <FieldError errors={[form.formState.errors.websiteUrl]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="careerUrl">Career page URL</FieldLabel>
            <Input id="careerUrl" {...form.register("careerUrl")} />
            <FieldError errors={[form.formState.errors.careerUrl]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="logoUrl">Logo URL</FieldLabel>
            <Input
              id="logoUrl"
              {...form.register("logoUrl", { setValueAs: emptyToUndefined })}
            />
            <FieldError errors={[form.formState.errors.logoUrl]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="atsPlatform">ATS platform</FieldLabel>
            <Input
              id="atsPlatform"
              {...form.register("atsPlatform", {
                setValueAs: emptyToUndefined,
              })}
            />
            <FieldError errors={[form.formState.errors.atsPlatform]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="status">Status</FieldLabel>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CompanyStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={CompanyStatus.INACTIVE}>
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[form.formState.errors.status]} />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Add company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
