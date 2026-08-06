import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { TrustRequestsTable } from "@dashboard-features/company/components/trust-requests-table";

export default async function CompanyTrustRequestsPage() {
  await requirePermission(PERMISSIONS.COMPANIES_TRUST);

  return (
    <div className="p-6">
      <TrustRequestsTable />
    </div>
  );
}
