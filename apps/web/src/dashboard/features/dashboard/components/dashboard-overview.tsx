"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClaudeUsage } from "@dashboard-features/ai-cost/hooks/use-claude-usage";
import { useDeepSeekBalance } from "@dashboard-features/ai-cost/hooks/use-deepseek-balance";
import { StatusPill } from "@dashboard-components/status-pill";
import type { StatusMeta } from "@dashboard/utils/status-variant";
import {
  companyScrapeStatusMeta,
  jobStatusMeta,
  queueJobStateMeta,
} from "@dashboard/utils/status-variant";
import {
  IconBuildingSkyscraper,
  IconClock,
  IconCurrencyDollar,
  IconRobot,
  IconStack2,
  IconWallet,
} from "@tabler/icons-react";
import { useDashboardStats } from "../hooks/use-dashboard-stats";

function StatList({
  entries,
  metaFor,
}: {
  entries: [string, number][];
  metaFor?: (key: string) => StatusMeta;
}) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      {entries.length ? (
        entries.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between">
            {metaFor ? (
              <StatusPill meta={metaFor(label)} label={label} />
            ) : (
              <span>{label}</span>
            )}
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
  const { data: claudeUsage } = useClaudeUsage();
  const { data: deepSeekBalance } = useDeepSeekBalance();

  if (!stats) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconClock className="text-muted-foreground size-4" />
              Last scrape run
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {stats.lastScrapeRunAt
              ? new Date(stats.lastScrapeRunAt).toLocaleString()
              : "Never"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCurrencyDollar className="text-primary size-4" />
              AI cost this month
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            ${stats.llmCostThisMonth.totalUsd.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBuildingSkyscraper className="text-muted-foreground size-4" />
              Companies by scrape status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatList
              entries={Object.entries(stats.companies.byScrapeStatus)}
              metaFor={companyScrapeStatusMeta}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBuildingSkyscraper className="text-muted-foreground size-4" />
              Jobs by status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatList
              entries={Object.entries(stats.jobs.byStatus)}
              metaFor={jobStatusMeta}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconStack2 className="text-muted-foreground size-4" />
              Scraper queues
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">Company queue</div>
              <StatList
                entries={Object.entries(stats.queues.company)}
                metaFor={queueJobStateMeta}
              />
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Jobs queue</div>
              <StatList
                entries={Object.entries(stats.queues.jobs)}
                metaFor={queueJobStateMeta}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCurrencyDollar className="text-primary size-4" />
              Claude billing (Admin API)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {!claudeUsage || !claudeUsage.configured ? (
              <span className="text-muted-foreground">
                Not configured — set CLAUDE_ADMIN_API_KEY to enable
              </span>
            ) : claudeUsage.error ? (
              <span className="text-destructive">
                Failed to fetch Claude usage
              </span>
            ) : (
              <div className="text-2xl font-semibold">
                {claudeUsage.totalCostUsd !== null
                  ? `$${claudeUsage.totalCostUsd.toFixed(2)}`
                  : "No cost data"}
                <div className="mt-1 text-sm font-normal text-muted-foreground">
                  this month, across {claudeUsage.byModel.length || "no"} model
                  {claudeUsage.byModel.length === 1 ? "" : "s"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconWallet className="text-muted-foreground size-4" />
              DeepSeek balance
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {!deepSeekBalance || !deepSeekBalance.configured ? (
              <span className="text-muted-foreground">
                Not configured — set DEEPSEEK_API_KEY to enable
              </span>
            ) : deepSeekBalance.error ? (
              <span className="text-destructive">
                Failed to fetch DeepSeek balance
              </span>
            ) : deepSeekBalance.balances.length ? (
              <div className="flex flex-col gap-2">
                {deepSeekBalance.balances.map((balance) => (
                  <div key={balance.currency} className="flex justify-between">
                    <span>{balance.currency}</span>
                    <span className="font-medium">{balance.totalBalance}</span>
                  </div>
                ))}
                <div className="text-xs text-muted-foreground">
                  Account-wide balance, not per-scrape cost
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">
                No balance data returned
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconRobot className="text-muted-foreground size-4" />
            AI usage by model
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          {stats.llmCostThisMonth.byProvider.length ? (
            <div className="flex flex-col gap-2 border-b pb-3">
              {stats.llmCostThisMonth.byProvider.map((row) => (
                <div key={row.provider} className="flex justify-between">
                  <span className="capitalize">{row.provider}</span>
                  <span className="text-muted-foreground">
                    {row.inputTokens} in / {row.outputTokens} out — $
                    {row.totalUsd.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
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
