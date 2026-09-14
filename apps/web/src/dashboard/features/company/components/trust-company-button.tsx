"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Company } from "@careerslk/types";
import { useState } from "react";
import { useTrustCompany, useUntrustCompany } from "../hooks/use-trust-company";
import { DenyTrustDialog } from "./deny-trust-dialog";

export function TrustCompanyButton({ company }: { company: Company }) {
  const trustCompany = useTrustCompany();
  const untrustCompany = useUntrustCompany();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (company.autoApproveJobs) {
    return (
      <>
        <Button
          variant="destructive"
          size="sm"
          disabled={untrustCompany.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          {untrustCompany.isPending ? "Revoking…" : "Revoke trust"}
        </Button>
        <DenyTrustDialog
          company={company}
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
        />
      </>
    );
  }

  return (
    <>
      <Button
        size="sm"
        disabled={trustCompany.isPending}
        onClick={() => setConfirmOpen(true)}
      >
        {trustCompany.isPending ? "Trusting…" : "Trust company"}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Trust ${company.name}?`}
        description="This grants auto-approval for this company's future job postings — they'll go live without manual review. Note: this change may take 1-2 business days to take effect."
        confirmLabel="Trust company"
        isPending={trustCompany.isPending}
        onConfirm={() => trustCompany.mutate(company.id)}
      />
    </>
  );
}
