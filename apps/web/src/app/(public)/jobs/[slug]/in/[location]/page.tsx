import PseoPageLayout from "@web-app-features/seo/components/pseo-page-layout";
import { seoPagesApi } from "@web-app-features/seo/api/api";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 86400; // ISR — changes daily as jobs update

type RoleLocationPageProps = {
  params: Promise<{ slug: string; location: string }>;
};

function buildSlug(role: string, location: string): string {
  return `jobs/${role}/in/${location}`;
}

export async function generateMetadata({
  params,
}: RoleLocationPageProps): Promise<Metadata> {
  const { slug: role, location } = await params;
  const result = await seoPagesApi.getBySlug(buildSlug(role, location));
  if (!result || result.page.retiredAt) return {};

  const { page } = result;
  return {
    title: page.title,
    description: page.metaDescription,
    alternates: { canonical: page.canonicalUrl },
    robots: page.isIndexable ? undefined : { index: false, follow: true },
  };
}

export default async function RoleLocationPage({
  params,
}: RoleLocationPageProps) {
  const { slug: role, location } = await params;
  const result = await seoPagesApi.getBySlug(buildSlug(role, location));
  if (!result || result.page.retiredAt) notFound();

  const { page, jobs, relatedLinks } = result;

  return (
    <PseoPageLayout
      page={page}
      jobs={jobs}
      relatedLinks={relatedLinks}
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Jobs", url: "/jobs" },
        { name: page.h1, url: `/jobs/${role}/in/${location}` },
      ]}
    />
  );
}
