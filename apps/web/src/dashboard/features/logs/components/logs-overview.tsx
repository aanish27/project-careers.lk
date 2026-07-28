"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAiBatchLogs } from "@dashboard-features/ai-batch-logs/hooks/use-ai-batch-logs";
import { useAiLogs } from "@dashboard-features/ai-logs/hooks/use-ai-logs";
import { useAuditLogs } from "@dashboard-features/audit-logs/hooks/use-audit-logs";
import { useQueueLogs } from "@dashboard-features/queue-logs/hooks/use-queue-logs";
import { useScrapeLogs } from "@dashboard-features/scrape-logs/hooks/use-scrape-logs";
import Link from "next/link";

function LogCard({
  title,
  href,
  count,
}: {
  title: string;
  href: string;
  count: number | undefined;
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:bg-accent">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">
          {count ?? "—"}
        </CardContent>
      </Card>
    </Link>
  );
}

export function LogsOverview() {
  const { data: auditLogs } = useAuditLogs();
  const { data: scrapeLogs } = useScrapeLogs();
  const { data: aiLogs } = useAiLogs();
  const { data: aiBatchLogs } = useAiBatchLogs();
  const { data: queueSnapshots } = useQueueLogs();

  const queuedJobs = queueSnapshots?.reduce(
    (total, snapshot) =>
      total + Object.values(snapshot.counts).reduce((a, b) => a + b, 0),
    0,
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <LogCard
        title="Audit Logs"
        href="/admin/logs/audit"
        count={auditLogs?.length}
      />
      <LogCard
        title="Scrape Logs"
        href="/admin/logs/scrapes"
        count={scrapeLogs?.length}
      />
      <LogCard title="AI Logs" href="/admin/logs/ai" count={aiLogs?.length} />
      <LogCard
        title="AI Batch Logs"
        href="/admin/logs/ai-batches"
        count={aiBatchLogs?.length}
      />
      <LogCard
        title="Queue Logs"
        href="/admin/logs/queues"
        count={queuedJobs}
      />
    </div>
  );
}
