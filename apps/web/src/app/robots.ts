import type { MetadataRoute } from "next";

const SITEMAP_BUCKETS = [
  "job-detail",
  "sector",
  "roles",
  "locations",
  "role-location",
  "skills",
  "companies",
  "misc",
  "freelancer-detail",
  "gig-detail",
];

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/*?*sort=*",
        "/*?*salary=*",
        "/*?*experience=*",
        "/*?*posted=*",
        "/*?*page=*",
      ],
    },
    // Decision #12 — list the known sitemap bucket URLs directly rather than
    // a separate hand-rolled sitemap-index route, since the bucket set is
    // fixed and known ahead of time.
    sitemap: SITEMAP_BUCKETS.map((bucket) => `${base}/sitemap/${bucket}.xml`),
  };
}
