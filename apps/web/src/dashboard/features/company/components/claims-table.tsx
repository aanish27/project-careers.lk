"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconUserCheck } from "@tabler/icons-react";
import Link from "next/link";
import { useApproveClaim } from "../hooks/use-approve-claim";
import { useCompanyClaims } from "../hooks/use-company-claims";
import { useRejectClaim } from "../hooks/use-reject-claim";

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function ClaimsTable() {
  const { data: claims } = useCompanyClaims("PENDING");
  const approveClaim = useApproveClaim();
  const rejectClaim = useRejectClaim();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconUserCheck className="text-primary size-4" />
          Company claim requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requested</TableHead>
              <TableHead>Web user</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims?.length ? (
              claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell>{formatDate(claim.createdAt)}</TableCell>
                  <TableCell>
                    <div>
                      {claim.webUser.firstName || claim.webUser.lastName
                        ? `${claim.webUser.firstName ?? ""} ${claim.webUser.lastName ?? ""}`.trim()
                        : "—"}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {claim.webUser.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/company/${claim.companyId}`}
                      className="underline"
                    >
                      {claim.company.name}
                    </Link>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      disabled={approveClaim.isPending}
                      onClick={() => approveClaim.mutate(claim.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={rejectClaim.isPending}
                      onClick={() => rejectClaim.mutate(claim.id)}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  No pending claim requests
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
