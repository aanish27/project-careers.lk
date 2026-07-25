"use client";

import { useState } from "react";
import type { PermissionGroup } from "@careerslk/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePermissions } from "@dashboard-hooks/use-permissions";
import { useSetRolePermissions } from "../hooks/use-roles";
import { PermissionPicker } from "./permission-picker";
import type { Role } from "../types/role.types";

function RolePermissionsBody({
  role,
  groups,
  onClose,
}: {
  role: Role;
  groups: PermissionGroup[];
  onClose: () => void;
}) {
  const setRolePermissions = useSetRolePermissions();
  const roleHeldKeys = new Set(role.permissions);

  const [selected, setSelected] = useState<Set<number>>(
    () =>
      new Set(
        groups
          .flatMap((g) => g.permissions)
          .filter((p) => roleHeldKeys.has(p.key))
          .map((p) => p.id),
      ),
  );

  const toggle = (permissionId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return next;
    });
  };

  const onSubmit = () => {
    setRolePermissions.mutate(
      { id: role.id, body: { permissionIds: [...selected] } },
      { onSuccess: onClose },
    );
  };

  return (
    <>
      <PermissionPicker
        groups={groups}
        selected={selected}
        onToggle={toggle}
        roleHeldKeys={roleHeldKeys}
      />
      <DialogFooter>
        <Button onClick={onSubmit} disabled={setRolePermissions.isPending}>
          {setRolePermissions.isPending ? "Saving…" : "Save permissions"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function RolePermissionsDialog({
  role,
  open,
  onOpenChange,
}: {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [openCount, setOpenCount] = useState(0);
  const { groups } = usePermissions();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) setOpenCount((c) => c + 1);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Permissions — {role.name}</DialogTitle>
        </DialogHeader>
        {open && (
          <RolePermissionsBody
            key={openCount}
            role={role}
            groups={groups}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
