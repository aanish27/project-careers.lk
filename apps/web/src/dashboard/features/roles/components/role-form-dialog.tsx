"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRole, useUpdateRole } from "../hooks/use-roles";
import {
  createRoleSchema,
  updateRoleSchema,
  type CreateRoleFormValues,
  type UpdateRoleFormValues,
} from "../types/role-schemas";
import type { Role } from "../types/role.types";

export function RoleFormDialog({
  role,
  open,
  onOpenChange,
}: {
  role?: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const createForm = useForm<CreateRoleFormValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { slug: "", name: "", description: "" },
  });

  const editForm = useForm<UpdateRoleFormValues>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      name: role?.name ?? "",
      description: role?.description ?? "",
    },
  });

  const isPending = createRole.isPending || updateRole.isPending;

  const onCreate = createForm.handleSubmit((values) => {
    createRole.mutate(values, {
      onSuccess: () => {
        onOpenChange(false);
        createForm.reset();
      },
    });
  });

  const onEdit = editForm.handleSubmit((values) => {
    if (!role) return;
    updateRole.mutate(
      { id: role.id, body: values },
      { onSuccess: () => onOpenChange(false) },
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {role ? `Edit ${role.name}` : "Create role"}
          </DialogTitle>
        </DialogHeader>
        {role ? (
          <form onSubmit={onEdit} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="edit-name">Name</FieldLabel>
              <Input id="edit-name" {...editForm.register("name")} />
              <FieldError errors={[editForm.formState.errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-description">Description</FieldLabel>
              <Textarea
                id="edit-description"
                {...editForm.register("description")}
              />
              <FieldError errors={[editForm.formState.errors.description]} />
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={onCreate} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="slug">Slug</FieldLabel>
              <Input
                id="slug"
                placeholder="content_editor"
                {...createForm.register("slug")}
              />
              <FieldError errors={[createForm.formState.errors.slug]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input id="name" {...createForm.register("name")} />
              <FieldError errors={[createForm.formState.errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                {...createForm.register("description")}
              />
              <FieldError errors={[createForm.formState.errors.description]} />
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating…" : "Create role"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
