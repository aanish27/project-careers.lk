import PseoPageLayout from "@web-app-features/seo/components/pseo-page-layout";
import { seoPagesApi } from "@web-app-features/seo/api/api";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 86400;

type SkillPageProps = {
  params: Promise<{ skill: string }>;
};

export async function generateMetadata({
  params,
}: SkillPageProps): Promise<Metadata> {
  const { skill } = await params;
  const result = await seoPagesApi.getBySlug(`jobs/skills/${skill}`);
  if (!result || result.page.retiredAt) return {};

  const { page } = result;
  return {
    title: page.title,
    description: page.metaDescription,
    alternates: { canonical: page.canonicalUrl },
    robots: page.isIndexable ? undefined : { index: false, follow: true },
  };
}

export default async function SkillPage({ params }: SkillPageProps) {
  const { skill } = await params;
  const result = await seoPagesApi.getBySlug(`jobs/skills/${skill}`);
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
        { name: page.h1, url: `/jobs/skills/${skill}` },
      ]}
    />
  );
}
