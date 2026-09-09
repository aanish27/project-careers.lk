import { jobsApi } from "@web-app-features/jobs/api/api";
import JobsListing from "@web-app-features/jobs/components/jobs-listing";
import { seoPagesApi } from "@web-app-features/seo/api/api";
import PseoPageLayout from "@web-app-features/seo/components/pseo-page-layout";
import { IBreadcrumbItem } from "@web-app-features/ui/types";
import { buildMetaData } from "@web-app-lib/structured-data";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 21600;

type SlugPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: SlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  return buildMetaData(`jobs/${slug}`);
}

export default async function JobsSlugPage({ params }: SlugPageProps) {
  const { slug } = await params;

  const pageSlug = `jobs/${slug}`;

  const [firstPage, seoContent] = await Promise.all([
    jobsApi.list({ slug: pageSlug }, { next: { tags: ["pseo-jobs"] } }),
    seoPagesApi.getSeoContent(pageSlug),
  ]);

  if (!seoContent || seoContent.page.retiredAt) notFound();

  const { page, relatedLinks } = seoContent;
  const breadcrumbs: IBreadcrumbItem[] = [
    { name: "Jobs", url: "/jobs" },
    { name: page.h1, url: `/${pageSlug}` },
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
        slug={pageSlug}
      />
    </PseoPageLayout>
  );
}
