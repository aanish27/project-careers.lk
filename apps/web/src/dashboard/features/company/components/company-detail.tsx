"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCompany } from "../hooks/use-company";
import {
  useCompanyAiLogs,
  useCompanyAuditLogs,
  useCompanyScrapeLogs,
} from "../hooks/use-company-logs";

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function CompanyDetail({ companyId }: { companyId: number }) {
  const { data: company } = useCompany(companyId);
  const { data: scrapeLogs } = useCompanyScrapeLogs(companyId);
  const { data: aiLogs } = useCompanyAiLogs(companyId);
  const { data: auditLogs } = useCompanyAuditLogs(companyId);

  if (!company) return null;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {company.name}
            <Badge
              variant={company.status === "ACTIVE" ? "default" : "secondary"}
            >
              {company.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Website</div>
            <a
              href={company.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {company.websiteUrl}
            </a>
          </div>
          <div>
            <div className="text-muted-foreground">Career page</div>
            <a
              href={company.careerUrl}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {company.careerUrl}
            </a>
          </div>
          <div>
            <div className="text-muted-foreground">ATS platform</div>
            <div>{company.atsPlatform ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Created</div>
            <div>{formatDate(company.createdAt)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scrape logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jobs found</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scrapeLogs?.length ? (
                scrapeLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDate(log.createdAt)}</TableCell>
                    <TableCell>{log.type}</TableCell>
                    <TableCell>{log.status}</TableCell>
                    <TableCell>{log.jobsFound}</TableCell>
                    <TableCell>{log.durationMs}ms</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    No scrape runs yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Input tokens</TableHead>
                <TableHead>Output tokens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aiLogs?.length ? (
                aiLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDate(log.createdAt)}</TableCell>
                    <TableCell>{log.status}</TableCell>
                    <TableCell>{log.model ?? "—"}</TableCell>
                    <TableCell>{log.inputTokens ?? "—"}</TableCell>
                    <TableCell>{log.outputTokens ?? "—"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    No AI calls yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs?.length ? (
                auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDate(log.createdAt)}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>
                      {log.actor?.email ?? log.actorEmail ?? "System"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    No recorded changes yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
