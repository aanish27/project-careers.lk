import { Badge } from "@/components/ui/badge";
import { sanitizeRichText, stripHtmlToText } from "@/lib/sanitize-html";
import { StructuredData } from "@/web-app/components/structured-data";
import { getJobSavedStatus } from "@/web-app/features/jobs/api/saved-jobs.actions";
import { JobDetailActions } from "@/web-app/features/jobs/components/job-detail/job-detail-actions";
import { DetailRow } from "@/web-app/features/jobs/components/job-detail/job-detail-row";
import { isRetired, loadJob } from "@/web-app/features/jobs/utils/job-checks";
import {
  buildBreadcrumbListSchema,
  buildJobPostingSchema,
} from "@/web-app/lib/structured-data";
import {
  formatEnumLabel,
  formatLocation,
  formatSalary,
} from "@/web-app/utils/job-formatters";
import {
  IconArrowLeft,
  IconBolt,
  IconBriefcase,
  IconBuildingSkyscraper,
  IconCalendar,
  IconCash,
  IconExternalLink,
  IconHome2,
  IconMapPin,
} from "@tabler/icons-react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadJob(slug);
  if (!result || isRetired(result.job)) return {};

  const { job } = result;
  const description = job.description
    ? stripHtmlToText(job.description).slice(0, 160)
    : `${job.title} at ${job.company.name} — apply now.`;

  return {
    title: `${job.title} at ${job.company.name} | Jobswala`,
    description,
    alternates: { canonical: `/job/${job.slug}` },
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

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await loadJob(slug);

  if (!result) notFound();

  const { job, canonicalSlug, isStaleSlug, relatedJobs } = result;

  // Preserves link equity per SRS 12.9.3 — redirect to the canonical slug
  // rather than 404ing when the job's title/company has since changed.
  if (isStaleSlug) permanentRedirect(`/job/${canonicalSlug}`);

  // SRS 12.9.3: expired jobs stay noindex + show a message rather than
  // 404ing immediately; only after 90 days do we retire the URL.
  if (isRetired(job)) notFound();

  const canonicalUrl = `/job/${job.slug}`;
  const isExpired = job.status === "EXPIRED";
  const isSaved = await getJobSavedStatus(job.id);

  const jobPostingSchema = buildJobPostingSchema(job, canonicalUrl);
  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: "/", url: "/" },
    { name: "Jobs", url: "/jobs" },
    { name: job.title, url: canonicalUrl },
  ]);

  const salary = formatSalary(job);
  const location = formatLocation(job);
  const applyUrl = !isExpired ? job.applyUrl : null;
  const cvEmail = !isExpired ? job.cvEmail : null;
  const walkIn = !isExpired && job.walkIn;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <StructuredData data={jobPostingSchema} />
      <StructuredData data={breadcrumbSchema} />

      <Link
        href="/jobs"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <IconArrowLeft className="size-4" aria-hidden="true" />
        Back to jobs
      </Link>

      {isExpired && (
        <div className="mb-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          This job is no longer active. It may have already been filled or
          removed by the employer.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start ">
        <div className="rounded-3xl sm:p-8 lg:col-span-2 w-full  border border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 shadow-[0_1px_4px_rgba(31,38,135,0.15)]">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {job.company.logoUrl ? (
                <Image
                  src={job.company.logoUrl}
                  alt={`${job.company.name} logo`}
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
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {job.title}
                </h1>
                <Link
                  href={`/companies/${job.company.slug}/jobs`}
                  className="font-semibold text-primary hover:underline"
                >
                  {job.company.name}
                </Link>
              </div>
            </div>
            <JobDetailActions
              jobId={job.id}
              title={job.title}
              url={canonicalUrl}
              applyUrl={applyUrl}
              cvEmail={cvEmail}
              walkIn={walkIn}
              initialSaved={isSaved}
            />
          </div>

          <div className="mb-8 flex flex-wrap items-center gap-2">
            {job.workMode && (
              <Badge variant="secondary" className="h-auto gap-1.5 px-2.5 py-1">
                <IconHome2 className="size-4" aria-hidden="true" />
                {formatEnumLabel(job.workMode)}
              </Badge>
            )}
            {location && (
              <Badge variant="secondary" className="h-auto gap-1.5 px-2.5 py-1">
                <IconMapPin className="size-4" aria-hidden="true" />
                {location}
              </Badge>
            )}
            {job.employmentType && (
              <Badge variant="secondary" className="h-auto gap-1.5 px-2.5 py-1">
                <IconBriefcase className="size-4" aria-hidden="true" />
                {formatEnumLabel(job.employmentType)}
              </Badge>
            )}
            {salary && (
              <Badge variant="secondary" className="h-auto gap-1.5 px-2.5 py-1">
                <IconCash className="size-4" aria-hidden="true" />
                {salary}
              </Badge>
            )}
            {job.deadline && (
              <Badge variant="secondary" className="h-auto gap-1.5 px-2.5 py-1">
                <IconCalendar className="size-4" aria-hidden="true" />
                Apply by {new Date(job.deadline).toLocaleDateString()}
              </Badge>
            )}
          </div>

          {job.description && (
            <section
              className="prose prose-sm sm:prose-base max-w-none prose-headings:font-bold prose-headings:text-foreground"
              dangerouslySetInnerHTML={{
                __html: sanitizeRichText(job.description),
              }}
            />
          )}
          {job.imageUrl && (
            <Image
              src={job.imageUrl}
              alt=""
              width={800}
              height={300}
              sizes="(min-width: 768px) 700px, 100vw"
              className="mt-6 aspect-auto h-auto w-full rounded-xl"
            />
          )}

          <section className="mt-8 border-t border-border pt-6">
            <h2 className="mb-3 text-lg font-bold">About {job.company.name}</h2>
            <Link
              href={`/companies/${job.company.slug}/jobs`}
              className="text-primary hover:underline"
            >
              View all jobs at {job.company.name}
            </Link>
          </section>

          {relatedJobs.sameCompany.length > 0 && (
            <section className="mt-8 border-t border-border pt-6">
              <h2 className="mb-3 text-lg font-bold">
                Similar roles at {job.company.name}
              </h2>
              <ul className="flex flex-col gap-2">
                {relatedJobs.sameCompany.map((related) => (
                  <li key={related.id}>
                    <Link
                      href={`/job/${related.slug}`}
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
            <section className="mt-8 border-t border-border pt-6">
              <h2 className="mb-3 text-lg font-bold">
                Other {job.title} jobs
                {job.district ? ` in ${job.district}` : ""}
              </h2>
              <ul className="flex flex-col gap-2">
                {relatedJobs.sameRole.map((related) => (
                  <li key={related.id}>
                    <Link
                      href={`/job/${related.slug}`}
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

        <aside className="rounded-3xl p-4 lg:sticky lg:top-6 w-full  border border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 shadow-[0_1px_4px_rgba(31,38,135,0.15)]">
          <h2 className="text-lg font-bold text-foreground">{job.title}</h2>

          <div className="mt-4 divide-y divide-border  border-border">
            {job.workMode && (
              <DetailRow
                icon={<IconHome2 className="size-4" aria-hidden="true" />}
                label="Workplace"
                value={formatEnumLabel(job.workMode)}
              />
            )}
            {location && (
              <DetailRow
                icon={<IconMapPin className="size-4" aria-hidden="true" />}
                label="Location"
                value={location}
              />
            )}
            {job.employmentType && (
              <DetailRow
                icon={<IconBriefcase className="size-4" aria-hidden="true" />}
                label="Job type"
                value={formatEnumLabel(job.employmentType)}
              />
            )}
            {salary && (
              <DetailRow
                icon={<IconCash className="size-4" aria-hidden="true" />}
                label="Salary"
                value={salary}
              />
            )}
            <DetailRow
              icon={<IconCalendar className="size-4" aria-hidden="true" />}
              label="Last updated"
              value={new Date(job.lastSeenAt).toLocaleDateString()}
            />
          </div>

          {applyUrl && (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/80"
            >
              <IconBolt className="size-4" aria-hidden="true" />
              Quick apply
              <IconExternalLink className="size-4" aria-hidden="true" />
            </a>
          )}
          {cvEmail && (
            <a
              href={`mailto:${cvEmail}?subject=${encodeURIComponent(`Application for ${job.title}`)}`}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full border border-input px-6 py-3 text-sm font-semibold hover:bg-muted"
            >
              Email your CV
            </a>
          )}
          {walkIn && (
            <div className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-muted px-6 py-3 text-sm font-semibold">
              Walk-in interview — no online application needed
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
