"use client";

import { useState } from "react";
import { PERMISSIONS } from "@careerslk/lib";
import { Button } from "@/components/ui/button";
import { Can } from "@dashboard-components/can";
import { RoleFormDialog } from "./role-form-dialog";

export function NewRoleButton() {
  const [open, setOpen] = useState(false);

  return (
    <Can permission={PERMISSIONS.ROLES_CREATE}>
      <Button onClick={() => setOpen(true)}>Create role</Button>
      <RoleFormDialog open={open} onOpenChange={setOpen} />
    </Can>
  );
}
