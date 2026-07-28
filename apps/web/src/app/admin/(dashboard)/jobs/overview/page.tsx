import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { JobsOverview } from "@dashboard-features/jobs/components/jobs-overview";

export default async function JobsOverviewPage() {
  await requirePermission(PERMISSIONS.JOBS_READ);

  return (
    <div className="p-6">
      <JobsOverview />
    </div>
  );
}
