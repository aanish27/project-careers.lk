import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { PendingGigsTable } from "@dashboard-features/gigs/components/pending-gigs-table";

export default async function PendingGigsPage() {
  await requirePermission(PERMISSIONS.GIGS_APPROVE);

  return (
    <div className="p-6">
      <PendingGigsTable />
    </div>
  );
}
