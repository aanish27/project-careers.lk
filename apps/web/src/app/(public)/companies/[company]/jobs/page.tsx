import { companiesApi } from "@web-app-features/companies/api/api";
import JobCard from "@web-app-features/jobs/components/job-card";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 86400;

type CompanyJobsPageProps = {
  params: Promise<{ company: string }>;
};

export async function generateMetadata({
  params,
}: CompanyJobsPageProps): Promise<Metadata> {
  const { company } = await params;
  const result = await companiesApi.getJobsBySlug(company);
  if (!result) return {};

  return {
    title: `Jobs at ${result.company.name} | Jobswala`,
    description: `Browse all current job openings at ${result.company.name}.`,
    alternates: { canonical: `/companies/${company}/jobs` },
  };
}

export default async function CompanyJobsPage({
  params,
}: CompanyJobsPageProps) {
  const { company } = await params;
  const result = await companiesApi.getJobsBySlug(company);
  if (!result) notFound();

  const { company: companyInfo, jobs } = result;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">
          Home
        </Link>{" "}
        &gt;{" "}
        <Link href={`/companies/${company}`} className="hover:underline">
          {companyInfo.name}
        </Link>{" "}
        &gt; Jobs
      </nav>

      <h1 className="mb-6 text-3xl font-bold text-foreground">
        All jobs at {companyInfo.name}
      </h1>

      {jobs.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
  );
}
