import StructuredData from "@web-app-components/structured-data";
import { jobsApi } from "@web-app-features/jobs/api/api";
import JobsListing from "@web-app-features/jobs/components/jobs-listing";
import { seoPagesApi } from "@web-app-features/seo/api/api";
import { buildFaqPageSchema } from "@web-app-lib/structured-data";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type JobsPageProps = {
  searchParams: Promise<{
    province?: string;
    district?: string;
    workMode?: string;
    employmentType?: string;
    salaryMin?: string;
    salaryMax?: string;
  }>;
};

// SRS 12.8.1: every parameterized/filtered URL canonicalizes to the base
// clean page. SRS 12.2.3: salary-filtered URLs specifically must never be
// indexed (an explicit "never index" example).
export async function generateMetadata({
  searchParams,
}: JobsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const hasSalaryFilter = Boolean(params.salaryMin || params.salaryMax);

  return {
    title: "Browse Jobs in Sri Lanka | Jobswala",
    description:
      "Explore the latest job openings across IT, engineering, sales, and more sectors in Sri Lanka. Filter by province, district, work mode, and employment type to find your next role.",
    alternates: { canonical: "/jobs" },
    robots: hasSalaryFilter ? { index: false, follow: true } : undefined,
  };
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const {
    province = "all",
    district = "all",
    workMode = "all",
    employmentType = "all",
    salaryMin,
    salaryMax,
  } = await searchParams;

  const [{ items: jobs }, allJobsPage] = await Promise.all([
    jobsApi.list({
      province: province !== "all" ? province : undefined,
      district: district !== "all" ? district : undefined,
      workMode: workMode !== "all" ? [workMode] : undefined,
      employmentType: employmentType !== "all" ? [employmentType] : undefined,
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
    }),
    seoPagesApi.getBySlug("jobs"),
  ]);

  const contentPage = allJobsPage?.page;
  const faqSchema = contentPage
    ? buildFaqPageSchema(contentPage.faqJson ?? [])
    : null;

  return (
    <>
      <JobsListing
        jobs={jobs}
        activeCategory="All Jobs"
        province={province}
        district={district}
        workMode={workMode}
        employmentType={employmentType}
      />

      {contentPage && (
        <div className="mx-auto max-w-6xl px-4 pb-10">
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
              <div className="flex flex-col gap-4">
                {contentPage.faqJson.map((item) => (
                  <div key={item.question}>
                    <h3 className="font-semibold">{item.question}</h3>
                    <p className="text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
