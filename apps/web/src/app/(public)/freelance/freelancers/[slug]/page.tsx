import { ApiError } from "@/lib/api-client";
import StructuredData from "@web-app-components/structured-data";
import { MessageButton } from "@web-app-features/chat/components/message-button";
import { freelancerProfilesApi } from "@web-app-features/freelance/api/api";
import type { PublicFreelancerProfile } from "@web-app-features/freelance/types";
import {
  buildBreadcrumbListSchema,
  buildFreelancerProfileSchema,
} from "@web-app-lib/structured-data";
import { ReportButton } from "@web-app-features/reports/components/report-button";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 21600; // 6h

type SlugPageProps = {
  params: Promise<{ slug: string }>;
};

async function loadProfile(
  slug: string,
): Promise<PublicFreelancerProfile | null> {
  try {
    return await freelancerProfilesApi.getBySlug(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: SlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await loadProfile(slug);
  if (!profile) return {};

  const description = profile.bio
    ? profile.bio.slice(0, 160)
    : `Hire this freelancer${profile.category ? ` for ${profile.category}` : ""} on careers.lk.`;

  return {
    title: `Freelancer${profile.category ? ` — ${profile.category}` : ""} | careers.lk`,
    description,
    alternates: { canonical: `/freelance/freelancers/${profile.slug}` },
  };
}

export default async function FreelancerProfilePage({ params }: SlugPageProps) {
  const { slug } = await params;
  const profile = await loadProfile(slug);
  if (!profile) notFound();

  const canonicalUrl = `/freelance/freelancers/${profile.slug}`;
  const profileSchema = buildFreelancerProfileSchema({
    name: `Freelancer${profile.category ? ` — ${profile.category}` : ""}`,
    url: canonicalUrl,
    bio: profile.bio,
    skills: profile.skills,
  });
  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: "Home", url: "/" },
    { name: "Freelance", url: "/freelance" },
    { name: "Freelancers", url: "/freelance/freelancers" },
    { name: `Profile #${profile.id}`, url: canonicalUrl },
  ]);

  return (
    <div className="mx-auto max-w-3xl py-10">
      <StructuredData data={profileSchema} />
      <StructuredData data={breadcrumbSchema} />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {profile.category && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {profile.category}
          </span>
        )}
        {profile.rate && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
            {profile.rate} {profile.rateCurrency ?? ""}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <MessageButton
            otherWebUserId={profile.webUserId}
            freelanceProfileId={profile.id}
          />
          <ReportButton entityType="FREELANCE_PROFILE" entityId={profile.id} />
        </div>
      </div>

      {profile.bio && (
        <section className="prose mb-8 max-w-none whitespace-pre-line">
          {profile.bio}
        </section>
      )}

      {profile.skills.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
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

      {profile.portfolioLinks.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">Portfolio links</h2>
          <ul className="flex flex-col gap-2">
            {profile.portfolioLinks.map((link) => (
              <li key={link}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {profile.workHistory && profile.workHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">Work history</h2>
          <ul className="flex flex-col gap-4">
            {profile.workHistory.map((entry, i) => (
              <li key={i}>
                <p className="font-semibold text-foreground">
                  {entry.title} — {entry.organization}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.startDate}
                  {entry.endDate ? ` – ${entry.endDate}` : " – Present"}
                </p>
                {entry.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entry.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {profile.cvUrl && (
        <a
          href={profile.cvUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Download CV
        </a>
      )}

      <div className="mt-8">
        <Link
          href="/freelance/freelancers"
          className="text-primary hover:underline"
        >
          ← Back to all freelancers
        </Link>
      </div>
    </div>
  );
}
