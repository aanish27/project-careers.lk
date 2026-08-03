import { jobsApi } from "@web-app-features/jobs/api/api";
import JobsListing from "@web-app-features/jobs/components/jobs-listing";
import { resolveSectorFromSlug } from "@web-app-features/jobs/utils/sector";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type SectorPageProps = {
  params: Promise<{ sector: string }>;
  searchParams: Promise<{
    location?: string;
    workMode?: string;
    employmentType?: string;
    salaryMin?: string;
    salaryMax?: string;
    skills?: string;
  }>;
};

export async function generateMetadata({
  params,
}: SectorPageProps): Promise<Metadata> {
  const { sector: sectorSlug } = await params;
  const sector = resolveSectorFromSlug(sectorSlug);
  if (!sector) return {};

  return {
    title: `${sector} Jobs in Sri Lanka | Jobswala`,
    description: `Browse the latest ${sector} job openings in Sri Lanka from top employers.`,
    alternates: { canonical: `/jobs/sector/${sectorSlug}` },
  };
}

export default async function SectorPage({
  params,
  searchParams,
}: SectorPageProps) {
  const { sector: sectorSlug } = await params;
  const sector = resolveSectorFromSlug(sectorSlug);
  if (!sector) notFound();

  const {
    location = "",
    workMode = "all",
    employmentType = "all",
    salaryMin,
    salaryMax,
    skills = "",
  } = await searchParams;

  const skillsList = skills
    ? skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const { items: jobs } = await jobsApi.list({
    sector,
    location: location.trim() || undefined,
    workMode: workMode !== "all" ? [workMode] : undefined,
    employmentType: employmentType !== "all" ? [employmentType] : undefined,
    salaryMin: salaryMin ? Number(salaryMin) : undefined,
    salaryMax: salaryMax ? Number(salaryMax) : undefined,
    skills: skillsList.length ? skillsList : undefined,
  });

  return (
    <JobsListing
      jobs={jobs}
      activeCategory={sector}
      location={location}
      workMode={workMode}
      employmentType={employmentType}
      salaryMin={salaryMin ? Number(salaryMin) : undefined}
      salaryMax={salaryMax ? Number(salaryMax) : undefined}
      skills={skillsList}
    />
  );
}
