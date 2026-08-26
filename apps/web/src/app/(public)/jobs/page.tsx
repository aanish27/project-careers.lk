import { loadJobFilters } from "@/web-app/features/jobs/hooks/job-filters-search-params";
import PseoPageLayout from "@/web-app/features/seo/components/pseo-page-layout";
import { IBreadcrumbItem } from "@web-app-features/ui/types";
import { jobsApi } from "@web-app-features/jobs/api/api";
import JobsListing from "@web-app-features/jobs/components/jobs-listing";
import { seoPagesApi } from "@web-app-features/seo/api/api";
import { buildMetaData } from "@web-app-lib/structured-data";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type JobsPageProps = {
  searchParams: Promise<{
    title?: string;
    location?: string;
    province?: string;
    district?: string;
    sector?: string;
    workMode?: string;
    employmentType?: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return buildMetaData();
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const { title, location } = await searchParams;
  const filters = await loadJobFilters(searchParams);

  const [firstPage, seoContent] = await Promise.all([
    jobsApi.list({
      title: title,
      location: location,
      ...filters,
      slug: "jobs",
    }),
    seoPagesApi.getSeoContent("jobs"),
  ]);

  if (!seoContent || seoContent.page.retiredAt) notFound();

  const page = seoContent?.page;
  const breadcrumbs: IBreadcrumbItem[] = [{ name: "jobs", url: "/jobs" }];

  return (
    <PseoPageLayout
      page={page}
      relatedLinks={seoContent.relatedLinks}
      breadcrumbs={breadcrumbs}
    >
      <JobsListing
        pageTitle={page.h1}
        pageDescription={page.metaDescription}
        initialPage={firstPage}
        slug="jobs"
      />
    </PseoPageLayout>
  );
}
