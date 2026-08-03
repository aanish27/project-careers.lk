import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { SeoPagesTable } from "@dashboard-features/seo/components/seo-pages-table";

export default async function SeoPage() {
  await requirePermission(PERMISSIONS.SEO_READ);

  return (
    <div className="p-6">
      <SeoPagesTable />
    </div>
  );
}
