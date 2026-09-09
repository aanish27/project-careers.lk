import PseoPageLayout from "@web-app-features/seo/components/pseo-page-layout";
import { IBreadcrumbItem } from "@web-app-features/ui/types";
import { jobsApi } from "@web-app-features/jobs/api/api";
import JobsListing from "@web-app-features/jobs/components/jobs-listing";
import { seoPagesApi } from "@web-app-features/seo/api/api";
import { buildMetaData } from "@web-app-lib/structured-data";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 86400;

const SLUG = "jobs/remote-jobs";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetaData(SLUG);
}

export default async function RemoteJobsPage() {
  const [firstPage, seoContent] = await Promise.all([
    jobsApi.list({ slug: SLUG }, { next: { tags: ["pseo-jobs"] } }),
    seoPagesApi.getSeoContent(SLUG),
  ]);

  if (!seoContent || seoContent.page.retiredAt) notFound();

  const { page, relatedLinks } = seoContent;
  const breadcrumbs: IBreadcrumbItem[] = [
    { name: "Jobs", url: "/jobs" },
    { name: page.h1, url: `/${SLUG}` },
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
        slug={SLUG}
      />
    </PseoPageLayout>
  );
}
