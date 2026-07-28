import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { ScrapeLogDetail } from "@dashboard-features/scrape-logs/components/scrape-log-detail";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ScrapeLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.SCRAPE_LOGS_READ);

  const { id } = await params;
  const scrapeLogId = Number(id);
  if (!Number.isFinite(scrapeLogId)) notFound();

  return (
    <div className="flex flex-col gap-4 p-6">
      <Link
        href="/admin/logs/scrapes"
        className="text-sm text-muted-foreground underline"
      >
        &larr; Back to scrape logs
      </Link>
      <ScrapeLogDetail scrapeLogId={scrapeLogId} />
    </div>
  );
}
