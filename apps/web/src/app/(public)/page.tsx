import { buttonVariants } from "@/components/ui/button";
import JobsSearchBar from "@/web-app/components/jobs-searchbar";
import { slugify } from "@careerslk/lib/slugify";
import { getCategoriesForSector, SECTORS } from "@careerslk/types";
import {
  IconArrowRight,
  IconBriefcase,
  IconBuildingSkyscraper,
  IconCalculator,
  IconCode,
  IconHeadset,
  IconPencil,
  IconSearch,
  IconSend2,
  IconSpeakerphone,
  IconStethoscope,
  IconToolsKitchen2,
  IconTrendingUp,
  type TablerIcon,
} from "@tabler/icons-react";
import LandingGradient from "@web-app-components/landing-gradient";
import { PrimaryNavbar } from "@web-app-components/primary-navbar";
import StructuredData from "@web-app-components/structured-data";
import { jobsApi } from "@web-app-features/jobs/api/api";
import CategoryCard from "@web-app-features/jobs/components/category/category-card";
import JobCard from "@web-app-features/jobs/components/job-card";
import JobsNavbar from "@web-app-features/jobs/components/jobs-navbar";
import { FaqAccordion } from "@web-app-features/seo/components/faq-accordion";
import { seoPagesApi } from "@web-app-features/seo/api/api";
import type { PublicJobCompany } from "@web-app-features/jobs/types";
import { buildFaqPageSchema } from "@web-app-lib/structured-data";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const RECENT_JOBS_LIMIT = 8;

const DEFAULT_TITLE = "Jobswala — Find Your Next Role in Sri Lanka";
const DEFAULT_DESCRIPTION =
  "Jobswala aggregates the latest job openings from companies across Sri Lanka — search by role, location, or company and apply directly.";

// The HOME SeoPage row (pageType=HOME, slug="") is a singleton, same
// pattern as ALL_JOBS's "jobs" row — see seo-generation.service.ts.
export async function generateMetadata(): Promise<Metadata> {
  const homePage = await seoPagesApi.getBySlug("");
  const content = homePage?.page;

  return {
    title: content?.title ?? DEFAULT_TITLE,
    description: content?.metaDescription ?? DEFAULT_DESCRIPTION,
    alternates: { canonical: "/" },
  };
}

// A curated subset of the full sector taxonomy (see category-sidebar.tsx for
// the complete list) — enough to fill the bento grid without overwhelming
// the homepage. "IT & Software" leads as the featured tile since it's the
// platform's highest-volume sector.
const HOME_SECTORS: { sector: (typeof SECTORS)[number]; icon: TablerIcon }[] = [
  { sector: "IT & Software", icon: IconCode },
  { sector: "Engineering & Construction", icon: IconBuildingSkyscraper },
  { sector: "Finance & Accounting", icon: IconCalculator },
  { sector: "Sales & Marketing", icon: IconSpeakerphone },
  { sector: "Administration & Management", icon: IconBriefcase },
  { sector: "Customer Service & Support", icon: IconHeadset },
  { sector: "Healthcare & Medical", icon: IconStethoscope },
  { sector: "Hospitality & Tourism", icon: IconToolsKitchen2 },
  { sector: "Media, Communications & Creative", icon: IconPencil },
];

const POPULAR_SEARCHES: { label: string; param: "title" | "location" }[] = [
  { label: "Software Engineer", param: "title" },
  { label: "Marketing", param: "title" },
  { label: "Accountant", param: "title" },
  { label: "Customer Support", param: "title" },
  { label: "Colombo", param: "location" },
];

const HOW_IT_WORKS = [
  {
    icon: IconSearch,
    title: "Search & filter",
    description:
      "Explore roles aggregated daily from company career pages and job boards across Sri Lanka.",
  },
  {
    icon: IconSend2,
    title: "Apply in one click",
    description:
      "Apply directly, or save roles to your list and come back when you're ready.",
  },
  {
    icon: IconTrendingUp,
    title: "Track & get hired",
    description:
      "Keep tabs on saved roles as you move toward your next offer — updated every day.",
  },
];

function dedupeCompanies(
  companies: PublicJobCompany[],
  limit: number,
): PublicJobCompany[] {
  const seen = new Map<string, PublicJobCompany>();
  for (const company of companies) {
    if (!seen.has(company.slug)) seen.set(company.slug, company);
  }
  return Array.from(seen.values()).slice(0, limit);
}

export default async function HomePage() {
  const [{ items: recentJobs }, homePage] = await Promise.all([
    jobsApi.list({ limit: RECENT_JOBS_LIMIT }),
    seoPagesApi.getBySlug(""),
  ]);

  const contentPage = homePage?.page;
  const faqSchema = contentPage
    ? buildFaqPageSchema(contentPage.faqJson ?? [])
    : null;

  const featuredCompanies = dedupeCompanies(
    recentJobs.map((job) => job.company),
    8,
  );

  return (
    <div className="relative flex min-h-screen flex-col ">
      <LandingGradient />
      <div className="sticky top-5 z-50 flex flex-col gap-3">
        <PrimaryNavbar />
        <JobsNavbar />
      </div>

      <main className="flex min-h-screen flex-1 -translate-y-10 flex-col items-center justify-center px-4 text-center">
        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          Aggregated from hundreds of Sri Lankan employers
        </span>
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          Find your next role.
        </h1>
        <p className="mb-8 max-w-lg text-lg text-muted-foreground">
          Aggregated from high-growth tech sources, curated for precision.
        </p>
        <JobsSearchBar />

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Popular:
          </span>
          {POPULAR_SEARCHES.map(({ label, param }) => (
            <Link
              key={label}
              href={`/jobs?${param}=${encodeURIComponent(label)}`}
              className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {label}
            </Link>
          ))}
        </div>

        {contentPage && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-border/60 bg-white/50 px-5 py-3 backdrop-blur-sm dark:bg-white/5">
            {featuredCompanies.length > 0 && (
              <div className="flex">
                {featuredCompanies.slice(0, 3).map((company) => (
                  <span
                    key={company.slug}
                    className="-ml-2 flex size-7 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-primary/10 text-[10px] font-bold text-primary first:ml-0"
                  >
                    {company.logoUrl ? (
                      <Image
                        src={company.logoUrl}
                        alt=""
                        width={28}
                        height={28}
                        className="size-full object-cover"
                      />
                    ) : (
                      company.name.slice(0, 2).toUpperCase()
                    )}
                  </span>
                ))}
              </div>
            )}
            <span className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">
                {contentPage.jobCount}
              </span>{" "}
              roles from{" "}
              <span className="font-bold text-foreground">
                {contentPage.companyCount}
              </span>{" "}
              companies
            </span>
          </div>
        )}
      </main>

      <section className="pb-8 pt-16">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-4xl font-extrabold tracking-tight text-foreground">
            Recent Jobs
          </h2>
          <p className="text-lg text-muted-foreground">
            Fresh roles from our latest scrape, updated daily.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {recentJobs.map((job, index) => (
            <JobCard key={job.id} job={job} index={index} />
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Link
            href="/jobs"
            className={buttonVariants({
              size: "lg",
              variant: "outline",
              className: "rounded-lg border-2 font-semibold",
            })}
          >
            View more jobs
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="mb-8">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
            Find jobs for every type of work
          </h2>
          <p className="text-muted-foreground">
            Browse by sector — from software to hospitality.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:auto-rows-[9.5rem] lg:grid-cols-4">
          {HOME_SECTORS.map(({ sector, icon }, index) => (
            <CategoryCard
              key={sector}
              href={`/jobs/sector/${slugify(sector)}`}
              icon={icon}
              label={sector}
              count={`${getCategoriesForSector(sector).length} specializations`}
              featured={index === 0}
            />
          ))}
        </div>
      </section>

      {featuredCompanies.length > 0 && (
        <section className="py-16">
          <div className="mb-8">
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
              Trusted by teams hiring right now
            </h2>
            <p className="text-muted-foreground">
              A snapshot of companies with live openings on Jobswala.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {featuredCompanies.map((company) => (
              <Link
                key={company.slug}
                href={`/companies/${company.slug}`}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {company.logoUrl ? (
                  <Image
                    src={company.logoUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 shrink-0 rounded-lg bg-white object-contain"
                  />
                ) : (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {company.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                  {company.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
            How Jobswala works
          </h2>
          <p className="text-muted-foreground">
            Three steps between you and your next role.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ icon: Icon, title, description }, index) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-6" stroke={1.75} />
              </span>
              <p className="mb-1 text-sm font-semibold text-primary">
                Step {index + 1}
              </p>
              <h3 className="mb-2 text-lg font-bold text-foreground">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="flex flex-col justify-between gap-6 rounded-3xl bg-primary p-8 text-primary-foreground sm:p-10">
            <div>
              <h3 className="mb-2 text-2xl font-bold">
                Looking for your next role?
              </h3>
              <p className="text-primary-foreground/80">
                Browse hundreds of live openings from companies across Sri
                Lanka.
              </p>
            </div>
            <Link
              href="/jobs"
              className={buttonVariants({
                variant: "secondary",
                size: "lg",
                className: "w-fit rounded-lg font-semibold",
              })}
            >
              Browse jobs <IconArrowRight className="size-4" />
            </Link>
          </div>
          <div className="flex flex-col justify-between gap-6 rounded-3xl border border-border bg-card p-8 sm:p-10">
            <div>
              <h3 className="mb-2 text-2xl font-bold text-foreground">
                Hiring for your team?
              </h3>
              <p className="text-muted-foreground">
                Post a job and reach candidates actively searching on Jobswala.
              </p>
            </div>
            <Link
              href="/post-job"
              className={buttonVariants({
                size: "lg",
                className: "w-fit rounded-lg font-semibold",
              })}
            >
              Post a job <IconArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {contentPage && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          {faqSchema && <StructuredData data={faqSchema} />}
          {contentPage.introText && (
            <div
              className="typeset mb-8"
              dangerouslySetInnerHTML={{ __html: contentPage.introText }}
            />
          )}
          {contentPage.bottomText && (
            <div
              className="typeset mb-8"
              dangerouslySetInnerHTML={{ __html: contentPage.bottomText }}
            />
          )}
          {contentPage.faqJson && contentPage.faqJson.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-bold">
                Frequently asked questions
              </h2>
              <FaqAccordion items={contentPage.faqJson} />
            </section>
          )}
        </section>
      )}
    </div>
  );
}
