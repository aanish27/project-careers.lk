import { PERMISSIONS } from "@careerslk/lib";
import { PermissionCatalogue } from "@/dashboard/features/roles/components/permission-catalogue";
import { requirePermission } from "@dashboard-lib/session";

export default async function PermissionsPage() {
  await requirePermission(PERMISSIONS.PERMISSIONS_READ);

  return (
    <div className="p-6">
      <PermissionCatalogue />
    </div>
  );
}
