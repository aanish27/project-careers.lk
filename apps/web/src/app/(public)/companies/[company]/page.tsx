import StructuredData from "@web-app-components/structured-data";
import { companiesApi } from "@web-app-features/companies/api/api";
import PseoPageLayout from "@web-app-features/seo/components/pseo-page-layout";
import { seoPagesApi } from "@web-app-features/seo/api/api";
import { buildOrganizationSchema } from "@web-app-lib/structured-data";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 86400; // ISR — job count changes frequently

type CompanyPageProps = {
  params: Promise<{ company: string }>;
};

export async function generateMetadata({
  params,
}: CompanyPageProps): Promise<Metadata> {
  const { company } = await params;
  const result = await seoPagesApi.getBySlug(`companies/${company}`);
  if (!result || result.page.retiredAt) return {};

  const { page } = result;
  return {
    title: page.title,
    description: page.metaDescription,
    alternates: { canonical: page.canonicalUrl },
    robots: page.isIndexable ? undefined : { index: false, follow: true },
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { company } = await params;
  const [seoResult, companyResult] = await Promise.all([
    seoPagesApi.getBySlug(`companies/${company}`),
    companiesApi.getBySlug(company),
  ]);

  if (!seoResult || seoResult.page.retiredAt) notFound();

  const { page, jobs, relatedLinks } = seoResult;
  const organizationSchema = companyResult
    ? buildOrganizationSchema({
        name: companyResult.company.name,
        url: companyResult.company.websiteUrl,
        logoUrl: companyResult.company.logoUrl,
      })
    : null;

  return (
    <>
      {organizationSchema && <StructuredData data={organizationSchema} />}
      <PseoPageLayout
        page={page}
        jobs={jobs}
        relatedLinks={relatedLinks}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Companies", url: "/jobs" },
          { name: page.h1, url: `/companies/${company}` },
        ]}
      />
    </>
  );
}
