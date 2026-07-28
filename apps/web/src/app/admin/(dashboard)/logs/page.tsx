import { requireAnyPermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { LogsOverview } from "@dashboard-features/logs/components/logs-overview";

export default async function LogsPage() {
  await requireAnyPermission([
    PERMISSIONS.AUDIT_LOGS_READ,
    PERMISSIONS.SCRAPE_LOGS_READ,
    PERMISSIONS.AI_LOGS_READ,
    PERMISSIONS.AI_BATCH_LOGS_READ,
    PERMISSIONS.QUEUE_LOGS_READ,
  ]);

  return (
    <div className="p-6">
      <LogsOverview />
    </div>
  );
}
