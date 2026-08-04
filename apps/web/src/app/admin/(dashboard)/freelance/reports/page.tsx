import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { PendingReportsTable } from "@dashboard-features/reports/components/pending-reports-table";

export default async function PendingReportsPage() {
  await requirePermission(PERMISSIONS.REPORTS_READ);

  return (
    <div className="p-6">
      <PendingReportsTable />
    </div>
  );
}
