import { PERMISSIONS } from "@careerslk/lib";
import { UsersTable } from "@/dashboard/features/users/components/users-table";
import { requirePermission } from "@dashboard-lib/session";

export default async function UsersPage() {
  await requirePermission(PERMISSIONS.USERS_READ);

  return (
    <div className="p-6">
      <UsersTable />
    </div>
  );
}
