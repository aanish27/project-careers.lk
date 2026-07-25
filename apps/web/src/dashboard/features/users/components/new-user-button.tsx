"use client";

import { PERMISSIONS } from "@careerslk/types";
import { Button } from "@/components/ui/button";
import { Can } from "@dashboard-components/can";
import { UserFormDialog } from "./user-form-dialog";

export function NewUserButton() {
  return (
    <Can permission={PERMISSIONS.USERS_CREATE}>
      <UserFormDialog>
        <Button>Create user</Button>
      </UserFormDialog>
    </Can>
  );
}
