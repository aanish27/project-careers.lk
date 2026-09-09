import {
  IconArrowLeft,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandX,
  IconBuildingSkyscraper,
  IconWorld,
} from "@tabler/icons-react";
import { PrimaryNavbar } from "@web-app-components/primary-navbar";
import { StructuredData } from "@web-app-components/structured-data";
import { companiesApi } from "@web-app-features/companies/api/api";
import JobCard from "@web-app-features/jobs/components/job-card";
import JobsNavbar from "@web-app-features/jobs/components/jobs-navbar";
import {
  buildBreadcrumbListSchema,
  buildCollectionPageSchema,
  buildOrganizationSchema,
} from "@web-app-lib/structured-data";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 86400;

type CompanyJobsPageProps = {
  params: Promise<{ company: string }>;
};

function buildCompanyDescription(
  companyName: string,
  description: string | null,
) {
  if (description) return description.slice(0, 160);
  return `Browse all current job openings at ${companyName}.`;
}

export async function generateMetadata({
  params,
}: CompanyJobsPageProps): Promise<Metadata> {
  const { company } = await params;
  const result = await companiesApi.getJobsBySlug(company);
  if (!result) return {};

  const { company: companyInfo } = result;
  const canonicalUrl = `/companies/${company}/jobs`;
  const title = `Jobs at ${companyInfo.name} | Jobswala`;
  const description = buildCompanyDescription(
    companyInfo.name,
    companyInfo.description,
  );

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonicalUrl,
      images: companyInfo.logoUrl ? [companyInfo.logoUrl] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: companyInfo.logoUrl ? [companyInfo.logoUrl] : undefined,
    },
  };
}

export default async function CompanyJobsPage({
  params,
}: CompanyJobsPageProps) {
  const { company } = await params;
  const result = await companiesApi.getJobsBySlug(company);
  if (!result) notFound();

  const { company: companyInfo, jobs } = result;
  const canonicalUrl = `/companies/${company}/jobs`;

  const organizationSchema = buildOrganizationSchema({
    name: companyInfo.name,
    url: companyInfo.websiteUrl ?? undefined,
    logoUrl: companyInfo.logoUrl,
  });
  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: "/", url: "/" },
    { name: "Jobs", url: "/jobs" },
    { name: companyInfo.name, url: canonicalUrl },
  ]);
  const collectionPageSchema = buildCollectionPageSchema({
    name: `Jobs at ${companyInfo.name}`,
    description: buildCompanyDescription(
      companyInfo.name,
      companyInfo.description,
    ),
    url: canonicalUrl,
    numberOfItems: jobs.length,
  });

  const socialLinks = [
    { href: companyInfo.websiteUrl, label: "Website", icon: IconWorld },
    {
      href: companyInfo.linkedinUrl,
      label: "LinkedIn",
      icon: IconBrandLinkedin,
    },
    { href: companyInfo.twitterUrl, label: "X", icon: IconBrandX },
    {
      href: companyInfo.facebookUrl,
      label: "Facebook",
      icon: IconBrandFacebook,
    },
    {
      href: companyInfo.instagramUrl,
      label: "Instagram",
      icon: IconBrandInstagram,
    },
  ].filter((link): link is typeof link & { href: string } => !!link.href);

  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData data={organizationSchema} />
      <StructuredData data={breadcrumbSchema} />
      <StructuredData data={collectionPageSchema} />

      <div className="sticky top-5 z-50 flex flex-col gap-3">
        <PrimaryNavbar />
        <JobsNavbar />
      </div>

      <div className="mx-auto w-full px-4 py-10">
        <Link
          href="/jobs"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="size-4" aria-hidden="true" />
          Back to jobs
        </Link>

        <div className="mb-8 flex flex-wrap items-center gap-4 rounded-3xl border border-white/60 p-6 shadow-[0_1px_4px_rgba(31,38,135,0.15)] sm:p-8 dark:border-white/10 dark:bg-white/5 bg-white/40">
          {companyInfo.logoUrl ? (
            <Image
              src={companyInfo.logoUrl}
              alt={`${companyInfo.name} logo`}
              width={64}
              height={64}
              className="rounded-xl object-contain bg-white ring-1 ring-foreground/10"
            />
          ) : (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted ring-1 ring-foreground/10">
              <IconBuildingSkyscraper
                className="size-7 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              {companyInfo.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {jobs.length} open {jobs.length === 1 ? "job" : "jobs"}
            </p>

            {companyInfo.description && (
              <p className="mt-3 max-w-2xl text-sm text-foreground/80">
                {companyInfo.description}
              </p>
            )}

            {socialLinks.length > 0 && (
              <div className="mt-4 flex items-center gap-3">
                {socialLinks.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {jobs.map((job, index) => (
              <JobCard key={job.id} job={job} index={index} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No active listings right now — check back soon.
          </p>
        )}
      </div>
    </div>
  );
}
