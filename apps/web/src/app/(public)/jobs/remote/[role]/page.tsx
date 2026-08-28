import { loadJobFilters } from "@/web-app/features/jobs/hooks/job-filters-search-params";
import PseoPageLayout from "@web-app-features/seo/components/pseo-page-layout";
import { IBreadcrumbItem } from "@web-app-features/ui/types";
import { jobsApi } from "@web-app-features/jobs/api/api";
import JobsListing from "@web-app-features/jobs/components/jobs-listing";
import { seoPagesApi } from "@web-app-features/seo/api/api";
import type { PseoSearchParams } from "@web-app-features/seo/types";
import { buildMetaData } from "@web-app-lib/structured-data";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 86400;

type RemoteRolePageProps = {
  params: Promise<{ role: string }>;
  searchParams: Promise<PseoSearchParams>;
};

export async function generateMetadata({
  params,
}: RemoteRolePageProps): Promise<Metadata> {
  const { role } = await params;
  return buildMetaData(`jobs/remote/${role}`);
}

export default async function RemoteRolePage({
  params,
  searchParams,
}: RemoteRolePageProps) {
  const { role } = await params;
  const slug = `jobs/remote/${role}`;
  const filters = await loadJobFilters(searchParams);

  const [firstPage, seoContent] = await Promise.all([
    jobsApi.list({ ...filters, slug }),
    seoPagesApi.getSeoContent(slug),
  ]);

  if (!seoContent || seoContent.page.retiredAt) notFound();

  const { page, relatedLinks } = seoContent;
  const breadcrumbs: IBreadcrumbItem[] = [
    { name: "Jobs", url: "/jobs" },
    { name: page.h1, url: `/${slug}` },
  ];

  return (
    <PseoPageLayout
      page={page}
      relatedLinks={relatedLinks}
      breadcrumbs={breadcrumbs}
    >
      <JobsListing
        pageTitle={page.h1}
        pageDescription={page.metaDescription}
        initialPage={firstPage}
        slug={slug}
      />
    </PseoPageLayout>
  );
}
