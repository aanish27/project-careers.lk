import { FeaturedCities } from "@/web-app/features/ui/components/featured-cities";
import { JobsEndCard } from "@/web-app/features/ui/components/jobs-end-cards";
import JobsIntro from "@/web-app/features/ui/components/jobs-intro";
import RecentJobs from "@/web-app/features/ui/components/recent-jobs";
import { SectorsSection } from "@/web-app/features/ui/components/sectors-section";
import { buildMetaData } from "@/web-app/lib/structured-data";
import { AppType } from "@careerslk/types";
import LandingGradient from "@web-app-components/landing-gradient";
import { PrimaryNavbar } from "@web-app-components/primary-navbar";
import { jobsApi } from "@web-app-features/jobs/api/api";
import JobsNavbar from "@web-app-features/jobs/components/jobs-navbar";
import { seoPagesApi } from "@web-app-features/seo/api/api";
import type { Metadata } from "next";

const RECENT_JOBS_LIMIT = 8;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetaData("");
}

export default async function HomePage() {
  const [{ items: recentJobs }, pageData] = await Promise.all([
    jobsApi.list({ limit: RECENT_JOBS_LIMIT }),
    seoPagesApi.getPublic(AppType.JOBS),
  ]);

  const stats = pageData?.stats;

  return (
    <div className="relative flex flex-col ">
      <LandingGradient />
      <div className="sticky top-5 z-50 flex flex-col gap-3">
        <PrimaryNavbar />
        <JobsNavbar />
      </div>
      <JobsIntro
        jobCount={stats?.totalJobs ?? 927}
        companyCount={stats?.totalCompanies ?? 123}
        sectorStats={stats?.bySector ?? []}
      />
      <RecentJobs recentJobs={recentJobs} />
      <FeaturedCities locationStats={stats?.byLocation ?? []} />
      <SectorsSection />
      <JobsEndCard />
    </div>
  );
}
