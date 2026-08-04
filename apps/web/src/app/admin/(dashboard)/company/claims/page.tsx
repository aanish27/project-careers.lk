import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { ClaimsTable } from "@dashboard-features/company/components/claims-table";

export default async function CompanyClaimsPage() {
  await requirePermission(PERMISSIONS.COMPANIES_CLAIMS_REVIEW);

  return (
    <div className="p-6">
      <ClaimsTable />
    </div>
  );
}
