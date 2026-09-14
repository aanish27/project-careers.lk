import { Poster } from "@/web-app/components/poster";
import StructuredData from "@web-app-components/structured-data";
import type { SeoPageData, SeoRelatedLink } from "@web-app-features/seo/types";
import {
  buildBreadcrumbListSchema,
  buildCollectionPageSchema,
} from "@web-app-lib/structured-data";
import { IBreadcrumbItem } from "@web-app-features/ui/types";
import Link from "next/link";
import { ReactNode } from "react";

interface IPseoPageLayout {
  page: SeoPageData;
  relatedLinks: SeoRelatedLink[];
  breadcrumbs: IBreadcrumbItem[];
  children: ReactNode;
}

export default function PseoPageLayout({
  page,
  relatedLinks,
  children,
  breadcrumbs,
}: IPseoPageLayout) {
  // Skill pSEO pages are no longer publicly visible — don't link into them
  // from other pSEO pages' "Related searches" even if backend-generated
  // related-links data still contains one.
  const visibleRelatedLinks = relatedLinks.filter(
    (link) => !link.slug.startsWith("jobs/skills/"),
  );

  const breadcrumbSchema = buildBreadcrumbListSchema(breadcrumbs);
  const collectionSchema = buildCollectionPageSchema({
    name: page.h1,
    description: page.metaDescription,
    url: page.canonicalUrl,
    numberOfItems: page.jobCount,
  });
  // const faqSchema = buildFaqPageSchema(page.faqJson ?? []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <StructuredData data={breadcrumbSchema} />
      <StructuredData data={collectionSchema} />

      {children}

      {visibleRelatedLinks.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold">Related searches</h2>
          <div className="flex flex-wrap gap-2">
            {visibleRelatedLinks.map((link: SeoRelatedLink) => (
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
      <Poster />
      {page && (
        <div className="mx-auto max-w-6xl px-4 pb-10">
          {page.introText && (
            <div
              className="typeset mb-8"
              dangerouslySetInnerHTML={{ __html: page.introText }}
            />
          )}
          {page.bottomText && (
            <div
              className="typeset mb-8"
              dangerouslySetInnerHTML={{ __html: page.bottomText }}
            />
          )}
        </div>
      )}

      {/* {page.faqJson && page.faqJson.length > 0 && (
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
      )} */}
    </div>
  );
}
