import { PERMISSIONS } from "@careerslk/lib";
import { RolesTable } from "@/dashboard/features/roles/components/roles-table";
import { requirePermission } from "@dashboard-lib/session";

export default async function RolesPage() {
  await requirePermission(PERMISSIONS.ROLES_READ);

  return (
    <div className="p-6">
      <RolesTable />
    </div>
  );
}
