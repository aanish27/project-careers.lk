"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SUPER_ADMIN_ROLE_SLUG } from "@careerslk/lib";
import type { Role } from "@careerslk/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@dashboard-lib/axios";
import { useAuth } from "@dashboard-hooks/use-auth";
import { useSetUserRoles } from "../hooks/use-users";
import type { AdminUser } from "@careerslk/types";

function AssignRolesBody({
  user,
  roles,
  onClose,
}: {
  user: AdminUser;
  roles: Role[];
  onClose: () => void;
}) {
  const { user: actor } = useAuth();
  const setUserRoles = useSetUserRoles();
  const [selected, setSelected] = useState<Set<number>>(
    () =>
      new Set(
        roles.filter((r) => user.roles.includes(r.slug)).map((r) => r.id),
      ),
  );

  const toggle = (roleId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const onSubmit = () => {
    setUserRoles.mutate(
      { id: user.id, body: { roleIds: [...selected] } },
      { onSuccess: onClose },
    );
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {roles.map((role) => {
          const locked =
            role.slug === SUPER_ADMIN_ROLE_SLUG && !actor.isSuperAdmin;
          const checkbox = (
            <div key={role.id} className="flex items-center gap-2">
              <Checkbox
                id={`role-${role.id}`}
                checked={selected.has(role.id)}
                disabled={locked}
                onCheckedChange={() => toggle(role.id)}
              />
              <Label htmlFor={`role-${role.id}`}>{role.name}</Label>
            </div>
          );

          if (!locked) return checkbox;

          return (
            <Tooltip key={role.id}>
              <TooltipTrigger render={checkbox} />
              <TooltipContent>
                Only a super admin can assign the super admin role.
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <DialogFooter>
        <Button onClick={onSubmit} disabled={setUserRoles.isPending}>
          {setUserRoles.isPending ? "Saving…" : "Save roles"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function AssignRolesDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [openCount, setOpenCount] = useState(0);

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get<Role[]>("/admin/roles").then((res) => res.data),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) setOpenCount((c) => c + 1);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Assign roles — {user.firstName} {user.lastName}
          </DialogTitle>
        </DialogHeader>
        {open && (
          <AssignRolesBody
            key={openCount}
            user={user}
            roles={roles}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
