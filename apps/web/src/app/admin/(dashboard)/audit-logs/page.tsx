import { JobsTable } from "@dashboard-features/jobs/components/jobs-table";

export default async function AuditLogsPage() {
  //   await requirePermission(PERMISSIONS.JOBS_READ);

  return (
    <div className="p-6">
      <JobsTable />
    </div>
  );
}
