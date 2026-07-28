import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { AuditLogsTable } from "@dashboard-features/audit-logs/components/audit-logs-table";

export default async function AuditLogsPage() {
  await requirePermission(PERMISSIONS.AUDIT_LOGS_READ);

  return (
    <div className="p-6">
      <AuditLogsTable />
    </div>
  );
}
