import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { JobDetail } from "@dashboard-features/jobs/components/job-detail";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.JOBS_READ);

  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isFinite(jobId)) notFound();

  return (
    <div className="flex flex-col gap-4 p-6">
      <Link
        href="/admin/jobs"
        className="text-sm text-muted-foreground underline"
      >
        &larr; Back to jobs
      </Link>
      <JobDetail jobId={jobId} />
    </div>
  );
}
