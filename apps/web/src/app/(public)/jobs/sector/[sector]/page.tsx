import PseoPageLayout from "@web-app-features/seo/components/pseo-page-layout";
import { IBreadcrumbItem } from "@web-app-features/ui/types";
import { jobsApi } from "@web-app-features/jobs/api/api";
import JobsListing from "@web-app-features/jobs/components/jobs-listing";
import { seoPagesApi } from "@web-app-features/seo/api/api";
import { resolveSectorFromSlug } from "@web-app-features/jobs/utils/sector";
import { buildMetaData } from "@web-app-lib/structured-data";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 86400; // ISR — changes with scrape runs

type SectorPageProps = {
  params: Promise<{ sector: string }>;
};

export async function generateMetadata({
  params,
}: SectorPageProps): Promise<Metadata> {
  const { sector: sectorSlug } = await params;
  if (!resolveSectorFromSlug(sectorSlug)) return {};

  return buildMetaData(`jobs/sector/${sectorSlug}`);
}

export default async function SectorPage({ params }: SectorPageProps) {
  const { sector: sectorSlug } = await params;
  if (!resolveSectorFromSlug(sectorSlug)) notFound();

  const slug = `jobs/sector/${sectorSlug}`;

  const [firstPage, seoContent] = await Promise.all([
    jobsApi.list({ slug }, { next: { tags: ["pseo-jobs"] } }),
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
