import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { AiBatchLogsTable } from "@dashboard-features/ai-batch-logs/components/ai-batch-logs-table";

export default async function AiBatchLogsPage() {
  await requirePermission(PERMISSIONS.AI_BATCH_LOGS_READ);

  return (
    <div className="p-6">
      <AiBatchLogsTable />
    </div>
  );
}
