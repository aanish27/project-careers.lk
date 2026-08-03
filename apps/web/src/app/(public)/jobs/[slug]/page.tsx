import { ApiError } from "@/lib/api-client";
import StructuredData from "@web-app-components/structured-data";
import { jobsApi } from "@web-app-features/jobs/api/api";
import type { PublicJobDetailResponse } from "@web-app-features/jobs/types";
import {
  buildBreadcrumbListSchema,
  buildJobPostingSchema,
} from "@web-app-lib/structured-data";
import { IconExternalLink } from "@tabler/icons-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

export const revalidate = 21600; // 6h — jobs may expire or update

const EXPIRED_JOB_RETIREMENT_DAYS = 90;

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
};

type JobDetailPageProps = {
  params: Promise<{ slug: string }>;
};

async function loadJob(slug: string): Promise<PublicJobDetailResponse | null> {
  try {
    return await jobsApi.getBySlug(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

function isRetired(job: PublicJobDetailResponse["job"]): boolean {
  if (job.status !== "EXPIRED") return false;
  const daysSinceLastSeen =
    (Date.now() - new Date(job.lastSeenAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceLastSeen > EXPIRED_JOB_RETIREMENT_DAYS;
}

export async function generateMetadata({
  params,
}: JobDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadJob(slug);
  if (!result || isRetired(result.job)) return {};

  const { job } = result;
  const description = job.description
    ? job.description.slice(0, 160)
    : `${job.title} at ${job.company.name} — apply now.`;

  return {
    title: `${job.title} at ${job.company.name} | Jobswala`,
    description,
    alternates: { canonical: `/jobs/${job.slug}` },
    robots:
      job.status === "EXPIRED" ? { index: false, follow: true } : undefined,
    openGraph: {
      title: job.title,
      description,
      images: job.company.logoUrl ? [job.company.logoUrl] : undefined,
    },
    twitter: {
      card: "summary",
      title: job.title,
      description,
    },
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params;
  const result = await loadJob(slug);
  if (!result) notFound();

  const { job, canonicalSlug, isStaleSlug, relatedJobs } = result;

  // Preserves link equity per SRS 12.9.3 — redirect to the canonical slug
  // rather than 404ing when the job's title/company has since changed.
  if (isStaleSlug) permanentRedirect(`/jobs/${canonicalSlug}`);

  // SRS 12.9.3: expired jobs stay noindex + show a message rather than
  // 404ing immediately; only after 90 days do we retire the URL.
  if (isRetired(job)) notFound();

  const canonicalUrl = `/jobs/${job.slug}`;
  const isExpired = job.status === "EXPIRED";

  const jobPostingSchema = buildJobPostingSchema(job, canonicalUrl);
  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: "Home", url: "/" },
    { name: "Jobs", url: "/jobs" },
    { name: job.title, url: canonicalUrl },
  ]);

  const explicitSkills = job.skills.filter((s) => s.type === "EXPLICIT");
  const inferredSkills = job.skills.filter((s) => s.type === "INFERRED");

  return (
    <div className="mx-auto max-w-4xl py-10">
      <StructuredData data={jobPostingSchema} />
      <StructuredData data={breadcrumbSchema} />

      {isExpired && (
        <div className="mb-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          This job is no longer active. It may have already been filled or
          removed by the employer.
        </div>
      )}

      <div className="mb-6 flex items-start gap-4">
        {job.company.logoUrl && (
          <Image
            src={job.company.logoUrl}
            alt={`${job.company.name} logo`}
            width={64}
            height={64}
            className="rounded-lg object-contain bg-white"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
          <Link
            href={`/companies/${job.company.slug}`}
            className="font-semibold text-primary hover:underline"
          >
            {job.company.name}
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {job.location && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
            {job.location}
          </span>
        )}
        {job.workMode && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize">
            {job.workMode}
          </span>
        )}
        {job.employmentType && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
            {EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType}
          </span>
        )}
        {(job.salaryRaw || job.salaryMin) && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
            {job.salaryRaw ??
              `${job.salaryCurrency ?? ""} ${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()}`}
          </span>
        )}
        {job.deadline && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
            Apply by {new Date(job.deadline).toLocaleDateString()}
          </span>
        )}
      </div>

      {!isExpired && job.applyUrl && (
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Apply on {job.company.name} <IconExternalLink className="size-4" />
        </a>
      )}

      {job.description && (
        <section className="prose mb-8 max-w-none whitespace-pre-line">
          {job.description}
        </section>
      )}

      {(explicitSkills.length > 0 || inferredSkills.length > 0) && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {explicitSkills.map((skill) => (
              <Link
                key={skill.name}
                href={`/jobs/skills/${skill.name.toLowerCase()}`}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
              >
                {skill.name}
              </Link>
            ))}
            {inferredSkills.map((skill) => (
              <Link
                key={skill.name}
                href={`/jobs/skills/${skill.name.toLowerCase()}`}
                className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted/80"
                title="Inferred from the job description"
              >
                {skill.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {job.keywords.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">Keywords</h2>
          <div className="flex flex-wrap gap-2">
            {job.keywords.map(({ keyword }) => (
              <Link
                key={keyword.id}
                href={`/jobs?q=${encodeURIComponent(keyword.name)}`}
                className="rounded-full bg-muted px-3 py-1 text-xs font-semibold hover:bg-muted/80"
              >
                {keyword.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">About {job.company.name}</h2>
        <Link
          href={`/companies/${job.company.slug}`}
          className="text-primary hover:underline"
        >
          View all jobs at {job.company.name}
        </Link>
      </section>

      {relatedJobs.sameCompany.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">
            Similar roles at {job.company.name}
          </h2>
          <ul className="flex flex-col gap-2">
            {relatedJobs.sameCompany.map((related) => (
              <li key={related.id}>
                <Link
                  href={`/jobs/${related.slug}`}
                  className="text-primary hover:underline"
                >
                  {related.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedJobs.sameRole.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">
            Other {job.title} jobs
            {job.location ? ` in ${job.location}` : ""}
          </h2>
          <ul className="flex flex-col gap-2">
            {relatedJobs.sameRole.map((related) => (
              <li key={related.id}>
                <Link
                  href={`/jobs/${related.slug}`}
                  className="text-primary hover:underline"
                >
                  {related.title} at {related.company.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
