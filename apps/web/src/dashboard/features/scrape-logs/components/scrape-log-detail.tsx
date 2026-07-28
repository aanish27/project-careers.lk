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
import Link from "next/link";
import { useScrapeLog } from "../hooks/use-scrape-logs";

export function ScrapeLogDetail({ scrapeLogId }: { scrapeLogId: number }) {
  const { data: log } = useScrapeLog(scrapeLogId);

  if (!log) return null;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Scrape #{log.id}
            <Badge variant={log.status === "SUCCESS" ? "default" : "secondary"}>
              {log.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Company</div>
            <Link
              href={`/admin/company/${log.company.id}`}
              className="underline"
            >
              {log.company.name}
            </Link>
          </div>
          <div>
            <div className="text-muted-foreground">Type</div>
            <div>{log.type}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Triggered by</div>
            <div>{log.triggeredBy}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Jobs found</div>
            <div>{log.jobsFound}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Duration</div>
            <div>{log.durationMs}ms</div>
          </div>
          <div>
            <div className="text-muted-foreground">HTML length</div>
            <div>{log.htmlLength ?? "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">AI cost</div>
            <div>
              {log.totalCostUsd !== null
                ? `$${log.totalCostUsd.toFixed(4)}`
                : "unpriced"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Date</div>
            <div>{new Date(log.createdAt).toLocaleString()}</div>
          </div>
          {log.errorMessage && (
            <div className="col-span-2">
              <div className="text-muted-foreground">Error</div>
              <div className="text-destructive">{log.errorMessage}</div>
            </div>
          )}
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
                <TableHead>Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {log.aiLogs.length ? (
                log.aiLogs.map((aiLog) => (
                  <TableRow key={aiLog.id}>
                    <TableCell>
                      {new Date(aiLog.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{aiLog.status}</TableCell>
                    <TableCell>{aiLog.model ?? "—"}</TableCell>
                    <TableCell>{aiLog.inputTokens ?? "—"}</TableCell>
                    <TableCell>{aiLog.outputTokens ?? "—"}</TableCell>
                    <TableCell>
                      {aiLog.costUsd !== null
                        ? `$${aiLog.costUsd.toFixed(4)}`
                        : "unpriced"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No AI calls for this run
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
