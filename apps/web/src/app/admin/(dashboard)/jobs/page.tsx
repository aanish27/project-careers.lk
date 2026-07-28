import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { JobsTable } from "@dashboard-features/jobs/components/jobs-table";

export default async function JobsPage() {
  await requirePermission(PERMISSIONS.JOBS_READ);

  return (
    <div className="p-6">
      <JobsTable />
    </div>
  );
}
