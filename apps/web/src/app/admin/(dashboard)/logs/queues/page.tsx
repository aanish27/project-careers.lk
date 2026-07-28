import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { QueueLogsView } from "@dashboard-features/queue-logs/components/queue-logs-view";

export default async function QueueLogsPage() {
  await requirePermission(PERMISSIONS.QUEUE_LOGS_READ);

  return (
    <div className="p-6">
      <QueueLogsView />
    </div>
  );
}
