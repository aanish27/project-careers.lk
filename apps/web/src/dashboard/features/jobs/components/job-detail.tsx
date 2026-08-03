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
import {
  useCompanyAiLogs,
  useCompanyScrapeLogs,
} from "@dashboard-features/company/hooks/use-company-logs";
import { StatusPill } from "@dashboard-components/status-pill";
import {
  aiBatchStatusMeta,
  aiLogStatusMeta,
  jobStatusMeta,
  scrapeLogStatusMeta,
} from "@dashboard/utils/status-variant";
import {
  IconBriefcase,
  IconClipboardList,
  IconHistory,
  IconRobot,
  IconTag,
} from "@tabler/icons-react";
import Link from "next/link";
import { useJob } from "../hooks/use-jobs";
import { useJobAiBatch, useJobAuditLogs } from "../hooks/use-job-logs";

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

export function JobDetail({ jobId }: { jobId: number }) {
  const { data: job } = useJob(jobId);
  const { data: aiBatch } = useJobAiBatch(job?.batchId ?? null);
  const { data: scrapeLogs } = useCompanyScrapeLogs(job?.companyId ?? NaN);
  const { data: aiLogs } = useCompanyAiLogs(job?.companyId ?? NaN);
  const { data: auditLogs } = useJobAuditLogs(jobId);

  if (!job) return null;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBriefcase className="text-primary size-4" />
            {job.title}
            <StatusPill meta={jobStatusMeta(job.status)} label={job.status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Company</div>
            <Link
              href={`/admin/company/${job.company.id}`}
              className="underline"
            >
              {job.company.name}
            </Link>
          </div>
          <div>
            <div className="text-muted-foreground">Location</div>
            <div>{job.location ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Work mode</div>
            <div>{job.workMode ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Employment type</div>
            <div>{job.employmentType ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Sector</div>
            <div>{job.sector ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Role category</div>
            <div>{job.roleCategory ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Department</div>
            <div>{job.department ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Salary</div>
            <div>
              {job.salaryRaw ??
                (job.salaryMin || job.salaryMax
                  ? `${job.salaryMin ?? "?"} - ${job.salaryMax ?? "?"} ${job.salaryCurrency ?? ""}`
                  : "—")}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Deadline</div>
            <div>{formatDate(job.deadline)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Last seen</div>
            <div>{formatDate(job.lastSeenAt)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Apply URL</div>
            {job.applyUrl ? (
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {job.applyUrl}
              </a>
            ) : (
              <div>—</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconTag className="text-muted-foreground size-4" />
            Keywords
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {job.keywords.length ? (
            job.keywords.map((jk) => (
              <Badge key={jk.keywordId} variant="secondary">
                {jk.keyword.name}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">
              No keywords assigned
            </span>
          )}
        </CardContent>
      </Card>

      {job.batchId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconRobot className="text-muted-foreground size-4" />
              AI batch
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Batch id</div>
              <div className="font-mono text-xs">{job.batchId}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Status</div>
              {aiBatch ? (
                <StatusPill
                  meta={aiBatchStatusMeta(aiBatch.status)}
                  label={aiBatch.status}
                />
              ) : (
                "—"
              )}
            </div>
            <div>
              <div className="text-muted-foreground">Type</div>
              <div>{aiBatch?.type ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Jobs in batch</div>
              <div>{aiBatch?.jobs.length ?? "—"}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconHistory className="text-muted-foreground size-4" />
            Company scrape activity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jobs found</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scrapeLogs?.length ? (
                scrapeLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDate(log.createdAt)}</TableCell>
                    <TableCell>{log.type}</TableCell>
                    <TableCell>
                      <StatusPill
                        meta={scrapeLogStatusMeta(log.status)}
                        label={log.status}
                      />
                    </TableCell>
                    <TableCell>{log.jobsFound}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    No scrape runs yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Model</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aiLogs?.length ? (
                aiLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDate(log.createdAt)}</TableCell>
                    <TableCell>
                      <StatusPill
                        meta={aiLogStatusMeta(log.status)}
                        label={log.status}
                      />
                    </TableCell>
                    <TableCell>{log.model ?? "—"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
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
          <CardTitle className="flex items-center gap-2">
            <IconClipboardList className="text-muted-foreground size-4" />
            Audit logs
          </CardTitle>
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
