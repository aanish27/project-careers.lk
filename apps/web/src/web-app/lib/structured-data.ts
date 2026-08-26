import type { PublicJobDetail } from "@web-app-features/jobs/types";
import { seoPagesApi } from "../features/seo/api/api";
import { IBreadcrumbItem } from "../features/ui/types";

/**
 * SRS 12.6.4: only populate schema fields backed by actual data, never
 * fabricate values.
 */
export function buildJobPostingSchema(
  job: PublicJobDetail,
  canonicalUrl: string,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description ?? job.title,
    datePosted: job.lastSeenAt,
    url: canonicalUrl,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company.name,
      ...(job.company.logoUrl ? { logo: job.company.logoUrl } : {}),
      ...(job.company.websiteUrl ? { sameAs: job.company.websiteUrl } : {}),
    },
  };

  if (job.deadline) schema.validThrough = job.deadline;
  if (job.employmentType) {
    schema.employmentType = job.employmentType.toUpperCase();
  }
  if (job.location) {
    schema.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "LK",
      },
    };
  }
  if (job.workMode?.toLowerCase() === "remote") {
    schema.jobLocationType = "TELECOMMUTE";
    schema.applicantLocationRequirements = {
      "@type": "Country",
      name: "Sri Lanka",
    };
  }
  if (job.salaryMin || job.salaryMax) {
    schema.baseSalary = {
      "@type": "MonetaryAmount",
      currency: job.salaryCurrency ?? "LKR",
      value: {
        "@type": "QuantitativeValue",
        ...(job.salaryMin ? { minValue: job.salaryMin } : {}),
        ...(job.salaryMax ? { maxValue: job.salaryMax } : {}),
        // Sri Lankan job listings conventionally quote monthly salary; we
        // have no per-job signal of pay period, so this is a market
        // convention default rather than a fabricated number.
        unitText: "MONTH",
      },
    };
  }

  return schema;
}

export function buildBreadcrumbListSchema(
  items: IBreadcrumbItem[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildCollectionPageSchema(params: {
  name: string;
  description: string;
  url: string;
  numberOfItems: number;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: params.name,
    description: params.description,
    url: params.url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: params.numberOfItems,
    },
  };
}

export interface OrganizationParams {
  name: string;
  url?: string;
  logoUrl?: string | null;
}

export function buildOrganizationSchema(
  params: OrganizationParams,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: params.name,
  };

  if (params.url) schema.url = params.url;
  if (params.logoUrl) schema.logo = params.logoUrl;

  return schema;
}

export interface FreelancerProfileSchemaParams {
  name: string;
  url: string;
  bio?: string | null;
  skills?: string[];
}

// Only populates fields backed by real profile data — same rule as
// buildJobPostingSchema.
export function buildFreelancerProfileSchema(
  params: FreelancerProfileSchemaParams,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: params.name,
    url: params.url,
  };

  if (params.bio) schema.description = params.bio;
  if (params.skills?.length) schema.knowsAbout = params.skills;

  return schema;
}

export interface GigPostingSchemaParams {
  title: string;
  description?: string | null;
  url: string;
  category?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  budgetCurrency?: string | null;
}

export function buildGigPostingSchema(
  params: GigPostingSchemaParams,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: params.title,
    url: params.url,
  };

  if (params.description) schema.description = params.description;
  if (params.category) schema.category = params.category;
  if (params.budgetMin || params.budgetMax) {
    schema.offers = {
      "@type": "Offer",
      priceCurrency: params.budgetCurrency ?? "LKR",
      ...(params.budgetMin ? { minPrice: params.budgetMin } : {}),
      ...(params.budgetMax ? { maxPrice: params.budgetMax } : {}),
    };
  }

  return schema;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** SRS decision #10 — FAQ content is admin-authored only, never fabricated. */
export function buildFaqPageSchema(
  items: FaqItem[],
): Record<string, unknown> | null {
  if (items.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

// SRS 12.8.1: every parameterized/filtered URL canonicalizes to the base
// clean page. SRS 12.2.3: salary-filtered URLs specifically must never be
// indexed (an explicit "never index" example).

export async function buildMetaData() {
  const result = await seoPagesApi.getSeoContent("jobs");
  if (!result || result.page.retiredAt) return {};
  const { page } = result;

  return {
    title: page.title,
    description: page.metaDescription,
    alternates: { canonical: page.canonicalUrl },
    robots: page.isIndexable ? undefined : { index: false, follow: true },
    openGraph: {
      type: "website",
      title: page.title,
      description: page.metaDescription,
      url: page.canonicalUrl,
      images: [
        { url: "/jobswala-logo.png", width: 360, height: 360, alt: "Jobswala" },
      ],
    },
    twitter: {
      card: "summary",
      title: page.title,
      description: page.metaDescription,
      images: ["/jobswala-logo.png"],
    },
  };
}
