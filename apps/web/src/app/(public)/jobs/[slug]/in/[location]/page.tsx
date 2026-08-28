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

export const revalidate = 86400; // ISR — changes daily as jobs update

type RoleLocationPageProps = {
  params: Promise<{ slug: string; location: string }>;
  searchParams: Promise<PseoSearchParams>;
};

export async function generateMetadata({
  params,
}: RoleLocationPageProps): Promise<Metadata> {
  const { slug: role, location } = await params;
  return buildMetaData(`jobs/${role}/in/${location}`);
}

export default async function RoleLocationPage({
  params,
  searchParams,
}: RoleLocationPageProps) {
  const { slug: role, location } = await params;
  const slug = `jobs/${role}/in/${location}`;
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
