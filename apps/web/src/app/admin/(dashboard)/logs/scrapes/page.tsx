import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { ScrapeLogsTable } from "@dashboard-features/scrape-logs/components/scrape-logs-table";

export default async function ScrapeLogsPage() {
  await requirePermission(PERMISSIONS.SCRAPE_LOGS_READ);

  return (
    <div className="p-6">
      <ScrapeLogsTable />
    </div>
  );
}
