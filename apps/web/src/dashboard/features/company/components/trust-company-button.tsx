"use client";

import { Button } from "@/components/ui/button";
import type { Company } from "@careerslk/types";
import { useTrustCompany, useUntrustCompany } from "../hooks/use-trust-company";

export function TrustCompanyButton({ company }: { company: Company }) {
  const trustCompany = useTrustCompany();
  const untrustCompany = useUntrustCompany();

  if (company.autoApproveJobs) {
    return (
      <Button
        variant="destructive"
        size="sm"
        disabled={untrustCompany.isPending}
        onClick={() => untrustCompany.mutate(company.id)}
      >
        {untrustCompany.isPending ? "Revoking…" : "Revoke trust"}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      disabled={trustCompany.isPending}
      onClick={() => trustCompany.mutate(company.id)}
    >
      {trustCompany.isPending ? "Trusting…" : "Trust company"}
    </Button>
  );
}
