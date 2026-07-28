import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { CompanyOverview } from "@dashboard-features/company/components/company-overview";

export default async function CompanyOverviewPage() {
  await requirePermission(PERMISSIONS.COMPANIES_READ);

  return (
    <div className="p-6">
      <CompanyOverview />
    </div>
  );
}
