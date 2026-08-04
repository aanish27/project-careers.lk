import { ApiError } from "@/lib/api-client";
import StructuredData from "@web-app-components/structured-data";
import { MessageButton } from "@web-app-features/chat/components/message-button";
import { gigsApi } from "@web-app-features/freelance/api/api";
import type { PublicGig } from "@web-app-features/freelance/types";
import {
  buildBreadcrumbListSchema,
  buildGigPostingSchema,
} from "@web-app-lib/structured-data";
import { ReportButton } from "@web-app-features/reports/components/report-button";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 21600; // 6h

type SlugPageProps = {
  params: Promise<{ slug: string }>;
};

async function loadGig(slug: string): Promise<PublicGig | null> {
  try {
    return await gigsApi.getBySlug(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: SlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const gig = await loadGig(slug);
  if (!gig) return {};

  const description = gig.description
    ? gig.description.slice(0, 160)
    : `${gig.title} — apply now on careers.lk.`;

  return {
    title: `${gig.title} | careers.lk`,
    description,
    alternates: { canonical: `/freelance/gigs/${gig.slug}` },
  };
}

export default async function GigDetailPage({ params }: SlugPageProps) {
  const { slug } = await params;
  const gig = await loadGig(slug);
  if (!gig) notFound();

  const canonicalUrl = `/freelance/gigs/${gig.slug}`;
  const gigSchema = buildGigPostingSchema({
    title: gig.title,
    description: gig.description,
    url: canonicalUrl,
    category: gig.category,
    budgetMin: gig.budgetMin,
    budgetMax: gig.budgetMax,
    budgetCurrency: gig.budgetCurrency,
  });
  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: "Home", url: "/" },
    { name: "Freelance", url: "/freelance" },
    { name: "Gigs", url: "/freelance/gigs" },
    { name: gig.title, url: canonicalUrl },
  ]);

  return (
    <div className="mx-auto max-w-3xl py-10">
      <StructuredData data={gigSchema} />
      <StructuredData data={breadcrumbSchema} />

      <div className="mb-4 flex items-start justify-between gap-2">
        <h1 className="text-2xl font-bold text-foreground">{gig.title}</h1>
        <div className="flex shrink-0 items-center gap-2">
          <MessageButton
            otherWebUserId={gig.postedByWebUserId}
            gigId={gig.id}
          />
          <ReportButton entityType="GIG" entityId={gig.id} />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {gig.category && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {gig.category}
          </span>
        )}
        {(gig.budgetMin || gig.budgetMax) && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
            {gig.budgetMin ?? ""}
            {gig.budgetMin && gig.budgetMax ? "–" : ""}
            {gig.budgetMax ?? ""} {gig.budgetCurrency ?? ""}
          </span>
        )}
        {gig.deadline && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
            Deadline {new Date(gig.deadline).toLocaleDateString()}
          </span>
        )}
      </div>

      {gig.description && (
        <section className="prose mb-8 max-w-none whitespace-pre-line">
          {gig.description}
        </section>
      )}

      {gig.skills.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {gig.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-muted px-3 py-1 text-xs font-semibold"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {gig.attachmentUrls.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">Attachments</h2>
          <ul className="flex flex-col gap-2">
            {gig.attachmentUrls.map((url, i) => (
              <li key={i}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Attachment {i + 1}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8">
        <Link href="/freelance/gigs" className="text-primary hover:underline">
          ← Back to all gigs
        </Link>
      </div>
    </div>
  );
}
