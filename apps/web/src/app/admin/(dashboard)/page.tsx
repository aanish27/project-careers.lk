import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { DashboardOverview } from "@dashboard-features/dashboard/components/dashboard-overview";

export default async function AdminHomePage() {
  await requirePermission(PERMISSIONS.DASHBOARD_READ);

  return (
    <div className="p-6">
      <DashboardOverview />
    </div>
  );
}
