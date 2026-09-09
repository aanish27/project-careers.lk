import PseoPageLayout from "@web-app-features/seo/components/pseo-page-layout";
import { IBreadcrumbItem } from "@web-app-features/ui/types";
import { jobsApi } from "@web-app-features/jobs/api/api";
import JobsListing from "@web-app-features/jobs/components/jobs-listing";
import { seoPagesApi } from "@web-app-features/seo/api/api";
import { buildMetaData } from "@web-app-lib/structured-data";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 86400; // ISR — changes daily as jobs update

type RoleLocationPageProps = {
  params: Promise<{ slug: string; location: string }>;
};

export async function generateMetadata({
  params,
}: RoleLocationPageProps): Promise<Metadata> {
  const { slug: role, location } = await params;
  return buildMetaData(`jobs/${role}/in/${location}`);
}

export default async function RoleLocationPage({
  params,
}: RoleLocationPageProps) {
  const { slug: role, location } = await params;
  const slug = `jobs/${role}/in/${location}`;

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
