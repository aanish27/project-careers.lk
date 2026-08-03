import StructuredData from "@web-app-components/structured-data";
import JobCard from "@web-app-features/jobs/components/job-card";
import type { PublicJob } from "@web-app-features/jobs/types";
import type { SeoPageData, SeoRelatedLink } from "@web-app-features/seo/types";
import {
  buildBreadcrumbListSchema,
  buildCollectionPageSchema,
  buildFaqPageSchema,
  type BreadcrumbItem,
} from "@web-app-lib/structured-data";
import Link from "next/link";

type PseoPageLayoutProps = {
  page: SeoPageData;
  jobs: PublicJob[];
  relatedLinks: SeoRelatedLink[];
  breadcrumbs: BreadcrumbItem[];
};

export default function PseoPageLayout({
  page,
  jobs,
  relatedLinks,
  breadcrumbs,
}: PseoPageLayoutProps) {
  const breadcrumbSchema = buildBreadcrumbListSchema(breadcrumbs);
  const collectionSchema = buildCollectionPageSchema({
    name: page.h1,
    description: page.metaDescription,
    url: page.canonicalUrl,
    numberOfItems: page.jobCount,
  });
  const faqSchema = buildFaqPageSchema(page.faqJson ?? []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <StructuredData data={breadcrumbSchema} />
      <StructuredData data={collectionSchema} />
      {faqSchema && <StructuredData data={faqSchema} />}

      <nav className="mb-4 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.url}>
            {index > 0 && " > "}
            {index === breadcrumbs.length - 1 ? (
              crumb.name
            ) : (
              <Link href={crumb.url} className="hover:underline">
                {crumb.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <h1 className="mb-4 text-3xl font-bold text-foreground">{page.h1}</h1>

      {page.introText && (
        <div
          className="typeset mb-8"
          dangerouslySetInnerHTML={{ __html: page.introText }}
        />
      )}

      {jobs.length > 0 ? (
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job, index) => (
            <JobCard key={job.id} job={job} index={index} />
          ))}
        </div>
      ) : (
        <p className="mb-10 text-muted-foreground">
          No active listings right now — check back soon.
        </p>
      )}

      {relatedLinks.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold">Related searches</h2>
          <div className="flex flex-wrap gap-2">
            {relatedLinks.map((link) => (
              <Link
                key={link.slug}
                href={`/${link.slug}`}
                className="rounded-full bg-muted px-3 py-1 text-xs font-semibold hover:bg-muted/80"
              >
                {link.h1}
              </Link>
            ))}
          </div>
        </section>
      )}

      {page.bottomText && (
        <div
          className="typeset mb-10"
          dangerouslySetInnerHTML={{ __html: page.bottomText }}
        />
      )}

      {page.faqJson && page.faqJson.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold">Frequently asked questions</h2>
          <div className="flex flex-col gap-4">
            {page.faqJson.map((item) => (
              <div key={item.question}>
                <h3 className="font-semibold">{item.question}</h3>
                <p className="text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
