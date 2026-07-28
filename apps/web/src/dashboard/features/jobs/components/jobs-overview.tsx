"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@dashboard-components/status-pill";
import { jobStatusMeta } from "@dashboard/utils/status-variant";
import {
  IconBriefcase,
  IconBuildingSkyscraper,
  IconEye,
} from "@tabler/icons-react";
import Link from "next/link";
import { useJobs } from "../hooks/use-jobs";

function countBy<T extends string>(values: T[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

export function JobsOverview() {
  const { data: jobs } = useJobs();

  if (!jobs) return null;

  const byStatus = countBy(jobs.map((job) => job.status));

  const jobsByCompany = countBy(jobs.map((job) => job.company.name));
  const topCompanies = Object.entries(jobsByCompany)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const recentlySeen = [...jobs]
    .sort(
      (a, b) =>
        new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime(),
    )
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBriefcase className="text-primary size-4" />
              Jobs by status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <StatusPill meta={jobStatusMeta(status)} label={status} />
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBuildingSkyscraper className="text-muted-foreground size-4" />
              Top companies by job count
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {topCompanies.length ? (
              topCompanies.map(([company, count]) => (
                <div key={company} className="flex justify-between">
                  <span>{company}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))
            ) : (
              <span className="text-muted-foreground">No jobs yet</span>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconEye className="text-muted-foreground size-4" />
            Recently seen jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {recentlySeen.length ? (
            recentlySeen.map((job) => (
              <div key={job.id} className="flex justify-between">
                <Link href={`/admin/jobs/${job.id}`} className="underline">
                  {job.title} &mdash; {job.company.name}
                </Link>
                <span className="text-muted-foreground">
                  {new Date(job.lastSeenAt).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <span className="text-muted-foreground">No jobs seen yet</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
