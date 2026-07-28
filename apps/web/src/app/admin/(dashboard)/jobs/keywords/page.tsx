import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { KeywordsTable } from "@dashboard-features/keywords/components/keywords-table";

export default async function KeywordsPage() {
  await requirePermission(PERMISSIONS.KEYWORDS_READ);

  return (
    <div className="p-6">
      <KeywordsTable />
    </div>
  );
}
