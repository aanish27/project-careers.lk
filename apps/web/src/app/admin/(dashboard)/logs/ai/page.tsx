import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { AiLogsTable } from "@dashboard-features/ai-logs/components/ai-logs-table";

export default async function AiLogsPage() {
  await requirePermission(PERMISSIONS.AI_LOGS_READ);

  return (
    <div className="p-6">
      <AiLogsTable />
    </div>
  );
}
