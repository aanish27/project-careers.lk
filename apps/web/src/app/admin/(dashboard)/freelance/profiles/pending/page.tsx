import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { PendingFreelanceProfilesTable } from "@dashboard-features/freelance-profiles/components/pending-freelance-profiles-table";

export default async function PendingFreelanceProfilesPage() {
  await requirePermission(PERMISSIONS.FREELANCE_PROFILES_APPROVE);

  return (
    <div className="p-6">
      <PendingFreelanceProfilesTable />
    </div>
  );
}
