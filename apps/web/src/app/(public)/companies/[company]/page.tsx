import { loadJobFilters } from "@/web-app/features/jobs/hooks/job-filters-search-params";
import StructuredData from "@web-app-components/structured-data";
import { companiesApi } from "@web-app-features/companies/api/api";
import { jobsApi } from "@web-app-features/jobs/api/api";
import JobsListing from "@web-app-features/jobs/components/jobs-listing";
import PseoPageLayout from "@web-app-features/seo/components/pseo-page-layout";
import { seoPagesApi } from "@web-app-features/seo/api/api";
import type { PseoSearchParams } from "@web-app-features/seo/types";
import { IBreadcrumbItem } from "@web-app-features/ui/types";
import {
  buildMetaData,
  buildOrganizationSchema,
} from "@web-app-lib/structured-data";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 86400; // ISR — job count changes frequently

type CompanyPageProps = {
  params: Promise<{ company: string }>;
  searchParams: Promise<PseoSearchParams>;
};

export async function generateMetadata({
  params,
}: CompanyPageProps): Promise<Metadata> {
  const { company } = await params;
  return buildMetaData(`companies/${company}`);
}

export default async function CompanyPage({
  params,
  searchParams,
}: CompanyPageProps) {
  const { company } = await params;
  const slug = `companies/${company}`;
  const filters = await loadJobFilters(searchParams);

  const [firstPage, seoContent, companyResult] = await Promise.all([
    jobsApi.list({ ...filters, slug }),
    seoPagesApi.getSeoContent(slug),
    companiesApi.getBySlug(company),
  ]);

  if (!seoContent || seoContent.page.retiredAt) notFound();

  const { page, relatedLinks } = seoContent;
  const organizationSchema = companyResult
    ? buildOrganizationSchema({
        name: companyResult.company.name,
        url: companyResult.company.websiteUrl,
        logoUrl: companyResult.company.logoUrl,
      })
    : null;
  const breadcrumbs: IBreadcrumbItem[] = [
    { name: "Companies", url: "/jobs" },
    { name: page.h1, url: `/${slug}` },
  ];

  return (
    <>
      {organizationSchema && <StructuredData data={organizationSchema} />}
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
    </>
  );
}
