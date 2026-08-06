import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import type { JobSource } from "@careerslk/types";
import { JobsTable } from "@dashboard-features/jobs/components/jobs-table";

const TITLES: Record<JobSource, string> = {
  POSTED: "Posted jobs",
  SCRAPED: "Scraped jobs",
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  await requirePermission(PERMISSIONS.JOBS_READ);
  const { source } = await searchParams;
  const jobSource =
    source === "POSTED" || source === "SCRAPED" ? source : undefined;

  return (
    <div className="p-6">
      <JobsTable
        source={jobSource}
        title={jobSource ? TITLES[jobSource] : "Jobs"}
      />
    </div>
  );
}
