"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "../hooks/use-dashboard-stats";

function StatList({ entries }: { entries: [string, number][] }) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      {entries.length ? (
        entries.map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span>{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))
      ) : (
        <span className="text-muted-foreground">No data yet</span>
      )}
    </div>
  );
}

export function DashboardOverview() {
  const { data: stats } = useDashboardStats();

  if (!stats) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Last scrape run</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {stats.lastScrapeRunAt
              ? new Date(stats.lastScrapeRunAt).toLocaleString()
              : "Never"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI cost this month</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            ${stats.llmCostThisMonth.totalUsd.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Companies by scrape status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatList
              entries={Object.entries(stats.companies.byScrapeStatus)}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Jobs by status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatList entries={Object.entries(stats.jobs.byStatus)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Scraper queues</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">Company queue</div>
              <StatList entries={Object.entries(stats.queues.company)} />
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Jobs queue</div>
              <StatList entries={Object.entries(stats.queues.jobs)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI usage by model</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {stats.llmCostThisMonth.byModel.length ? (
            stats.llmCostThisMonth.byModel.map((row) => (
              <div key={row.model} className="flex justify-between">
                <span>{row.model}</span>
                <span className="text-muted-foreground">
                  {row.inputTokens} in / {row.outputTokens} out —{" "}
                  {row.estimatedUsd !== null
                    ? `$${row.estimatedUsd.toFixed(4)}`
                    : "unpriced"}
                </span>
              </div>
            ))
          ) : (
            <span className="text-muted-foreground">
              No AI usage recorded this month
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
