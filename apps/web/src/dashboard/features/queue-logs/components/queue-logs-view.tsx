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
import { useQueueLogs } from "../hooks/use-queue-logs";

export function QueueLogsView() {
  const { data: snapshots } = useQueueLogs();

  if (!snapshots) return null;

  return (
    <div className="flex flex-col gap-6">
      {snapshots.map((snapshot) => (
        <Card key={snapshot.queue}>
          <CardHeader>
            <CardTitle>{snapshot.queue}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(snapshot.counts).map(([state, count]) => (
                <Badge key={state} variant="secondary">
                  {state}: {count}
                </Badge>
              ))}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Enqueued</TableHead>
                  <TableHead>Failed reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.jobs.length ? (
                  snapshot.jobs.map((job) => (
                    <TableRow key={`${job.state}-${job.id}`}>
                      <TableCell>{job.name}</TableCell>
                      <TableCell>{job.state}</TableCell>
                      <TableCell>{job.attemptsMade}</TableCell>
                      <TableCell>
                        {new Date(job.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{job.failedReason ?? "—"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      No jobs sampled
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
