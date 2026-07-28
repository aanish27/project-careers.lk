"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompanies } from "../hooks/use-companies";

function countBy<T extends string>(values: T[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

export function CompanyOverview() {
  const { data: companies } = useCompanies();

  if (!companies) return null;

  const byStatus = countBy(companies.map((c) => c.status));
  const byScrapeStatus = countBy(companies.map((c) => c.scrapeStatus));
  const recentlyScraped = [...companies]
    .filter((c) => c.lastScrapedAt)
    .sort(
      (a, b) =>
        new Date(b.lastScrapedAt!).getTime() -
        new Date(a.lastScrapedAt!).getTime(),
    )
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Companies by status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span>{status}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Companies by scrape status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {Object.entries(byScrapeStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span>{status}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recently scraped</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {recentlyScraped.length ? (
            recentlyScraped.map((company) => (
              <div key={company.id} className="flex justify-between">
                <span>{company.name}</span>
                <span className="text-muted-foreground">
                  {new Date(company.lastScrapedAt!).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <span className="text-muted-foreground">
              No companies scraped yet
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
