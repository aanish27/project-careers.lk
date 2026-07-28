import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { JobsTable } from "@dashboard-features/jobs/components/jobs-table";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CompanyJobsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.JOBS_READ);

  const { id } = await params;
  const companyId = Number(id);
  if (!Number.isFinite(companyId)) notFound();

  return (
    <div className="flex flex-col gap-4 p-6">
      <Link
        href={`/admin/company/${companyId}`}
        className="text-sm text-muted-foreground underline"
      >
        &larr; Back to company
      </Link>
      <JobsTable companyId={companyId} />
    </div>
  );
}
