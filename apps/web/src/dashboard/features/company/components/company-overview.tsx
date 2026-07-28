"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusPill } from "@dashboard-components/status-pill";
import {
  companyScrapeStatusMeta,
  companyStatusMeta,
  scrapeLogStatusMeta,
} from "@dashboard/utils/status-variant";
import {
  IconBuildingSkyscraper,
  IconHistory,
  IconRefresh,
} from "@tabler/icons-react";
import { useCompanies } from "../hooks/use-companies";
import { useCompanyScrapeSummaries } from "../hooks/use-company-scrape-summaries";

function countBy<T extends string>(values: T[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

export function CompanyOverview() {
  const { data: companies } = useCompanies();
  const { data: scrapeSummaries } = useCompanyScrapeSummaries();

  if (!companies) return null;

  const byStatus = countBy(companies.map((c) => c.status));
  const byScrapeStatus = countBy(companies.map((c) => c.scrapeStatus));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBuildingSkyscraper className="text-primary size-4" />
              Companies by status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <StatusPill meta={companyStatusMeta(status)} label={status} />
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconRefresh className="text-muted-foreground size-4" />
              Companies by scrape status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {Object.entries(byScrapeStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <StatusPill
                  meta={companyScrapeStatusMeta(status)}
                  label={status}
                />
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconHistory className="text-muted-foreground size-4" />
            Scrape summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Active jobs</TableHead>
                <TableHead>Expired jobs</TableHead>
                <TableHead>Last scrape</TableHead>
                <TableHead>Jobs found</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scrapeSummaries?.length ? (
                scrapeSummaries.map((summary) => (
                  <TableRow key={summary.companyId}>
                    <TableCell>{summary.companyName}</TableCell>
                    <TableCell>{summary.activeJobs}</TableCell>
                    <TableCell>{summary.expiredJobs}</TableCell>
                    <TableCell>
                      {summary.lastScrape ? (
                        <StatusPill
                          meta={scrapeLogStatusMeta(summary.lastScrape.status)}
                          label={summary.lastScrape.status}
                        />
                      ) : (
                        <span className="text-muted-foreground">
                          Never scraped
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {summary.lastScrape?.jobsFound ?? "—"}
                    </TableCell>
                    <TableCell>
                      {summary.lastScrape
                        ? new Date(
                            summary.lastScrape.createdAt,
                          ).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-destructive">
                      {summary.lastScrape?.errorMessage ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    No companies scraped yet
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
