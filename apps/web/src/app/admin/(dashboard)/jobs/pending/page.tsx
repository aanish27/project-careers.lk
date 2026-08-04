import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { PendingJobsTable } from "@dashboard-features/jobs/components/pending-jobs-table";

export default async function PendingJobsPage() {
  await requirePermission(PERMISSIONS.JOBS_APPROVE);

  return (
    <div className="p-6">
      <PendingJobsTable />
    </div>
  );
}
