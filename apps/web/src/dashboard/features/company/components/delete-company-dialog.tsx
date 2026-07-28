"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Company } from "@careerslk/types";
import { useDeleteCompany } from "../hooks/use-delete-company";

export function DeleteCompanyDialog({
  company,
  open,
  onOpenChange,
}: {
  company: Company;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteCompany = useDeleteCompany();

  const onConfirm = () => {
    deleteCompany.mutate(company.id, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {company.name}?</DialogTitle>
          <DialogDescription>
            This removes the company and stops any further scraping. This cannot
            be undone from the UI.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={deleteCompany.isPending}
          >
            {deleteCompany.isPending ? "Deleting…" : "Delete company"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
