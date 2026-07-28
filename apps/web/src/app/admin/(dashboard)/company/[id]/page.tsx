import { requirePermission } from "@/dashboard/lib/session";
import { PERMISSIONS } from "@careerslk/lib";
import { CompanyDetail } from "@dashboard-features/company/components/company-detail";
import { IconBriefcase } from "@tabler/icons-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.COMPANIES_READ);

  const { id } = await params;
  const companyId = Number(id);
  if (!Number.isFinite(companyId)) notFound();

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/company"
          className="text-sm text-muted-foreground underline"
        >
          &larr; Back to companies
        </Link>
        <Link
          href={`/admin/company/${companyId}/jobs`}
          className="flex items-center gap-1.5 text-sm underline"
        >
          <IconBriefcase className="size-4" />
          View jobs
        </Link>
      </div>
      <CompanyDetail companyId={companyId} />
    </div>
  );
}
