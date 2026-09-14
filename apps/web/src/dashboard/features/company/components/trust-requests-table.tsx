"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Company } from "@careerslk/types";
import { IconShieldCheck } from "@tabler/icons-react";
import Link from "next/link";
import { useCompanies } from "../hooks/use-companies";
import { useTrustCompany } from "../hooks/use-trust-company";
import { DenyTrustDialog } from "./deny-trust-dialog";

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

function RowActions({ company }: { company: Company }) {
  const trustCompany = useTrustCompany();
  const [confirmTrust, setConfirmTrust] = useState(false);
  const [denyOpen, setDenyOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          disabled={trustCompany.isPending}
          onClick={() => setConfirmTrust(true)}
        >
          Trust
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setDenyOpen(true)}
        >
          Deny
        </Button>
      </div>
      <ConfirmDialog
        open={confirmTrust}
        onOpenChange={setConfirmTrust}
        title={`Trust ${company.name}?`}
        description="This grants auto-approval for this company's future job postings — they'll go live without manual review. Note: this change may take 1-2 business days to take effect."
        confirmLabel="Trust company"
        isPending={trustCompany.isPending}
        onConfirm={() => trustCompany.mutate(company.id)}
      />
      <DenyTrustDialog
        company={company}
        open={denyOpen}
        onOpenChange={setDenyOpen}
      />
    </>
  );
}

export function TrustRequestsTable() {
  const { data: companies } = useCompanies("REQUESTED");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconShieldCheck className="text-primary size-4" />
          Auto-approval (trust) requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requested</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies?.length ? (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    {formatDate(company.autoApprovalRequestedAt)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/company/${company.id}`}
                      className="underline"
                    >
                      {company.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <RowActions company={company} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground"
                >
                  No pending trust requests
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
