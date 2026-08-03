import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { SeoPageDetail } from "@dashboard-features/seo/components/seo-page-detail";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SeoPageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.SEO_READ);

  const { id } = await params;
  const pageId = Number(id);
  if (!Number.isFinite(pageId)) notFound();

  return (
    <div className="flex flex-col gap-4 p-6">
      <Link
        href="/admin/seo"
        className="text-sm text-muted-foreground underline"
      >
        &larr; Back to SEO pages
      </Link>
      <SeoPageDetail pageId={pageId} />
    </div>
  );
}
