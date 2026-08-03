import { Button } from "@/components/ui/button";
import {
  IconBriefcase,
  IconCalculator,
  IconChartBar,
  IconCode,
  IconHeadset,
  IconMapPin,
  IconPencil,
  IconRocket,
  IconScale,
  IconSpeakerphone,
  IconUsersGroup,
} from "@tabler/icons-react";
import LandingGradient from "@web-app-components/landing-gradient";
import { PrimaryNavbar } from "@web-app-components/primary-navbar";
import CategoryCard from "@web-app-features/jobs/components/category/category-card";
import JobCard from "@web-app-features/jobs/components/job-card";
import JobsNavbar from "@web-app-features/jobs/components/jobs-navbar";
import { jobsApi } from "@web-app-features/jobs/api/api";

const RECENT_JOBS_LIMIT = 8;

const CATEGORIES = [
  { label: "Engineering", icon: IconCode, count: 312 },
  { label: "Design & Creative", icon: IconPencil, count: 148 },
  { label: "Sales & Marketing", icon: IconSpeakerphone, count: 96 },
  { label: "Product", icon: IconRocket, count: 58 },
  { label: "Finance & Accounting", icon: IconCalculator, count: 67 },
  { label: "Admin & Support", icon: IconHeadset, count: 85 },
  { label: "Operations", icon: IconBriefcase, count: 73 },
  { label: "HR & Training", icon: IconUsersGroup, count: 41 },
  { label: "Legal", icon: IconScale, count: 29 },
  { label: "Analytics", icon: IconChartBar, count: 124 },
];

export default async function HomePage() {
  const { items: recentJobs } = await jobsApi.list({
    limit: RECENT_JOBS_LIMIT,
  });

  return (
    <div className="relative flex min-h-screen flex-col ">
      <LandingGradient />
      <div className="sticky top-5 z-50 flex flex-col gap-3">
        <PrimaryNavbar />
        <JobsNavbar />
      </div>
      <main className="flex min-h-screen flex-1 -translate-y-10 flex-col items-center justify-center text-center">
        <div className="mb-4 text-6xl font-extrabold tracking-tight text-foreground">
          Find your next role.
        </div>
        <div className="mb-8 text-lg text-muted-foreground">
          Aggregated from high-growth tech sources, curated for precision.
        </div>
        <div className="flex w-full max-w-3xl items-center gap-px rounded-xl bg-white p-2">
          <div className="flex flex-1 items-center gap-2 px-4 py-3">
            <IconBriefcase className="size-5 text-muted-foreground" />
            <span className="text-base text-muted-foreground">
              Job title or company
            </span>
          </div>
          <div className="flex flex-1 items-center gap-2 border-l border-border px-4 py-3">
            <IconMapPin className="size-5 text-muted-foreground" />
            <span className="text-base text-muted-foreground">
              City or remote
            </span>
          </div>
          <Button size="lg" className="font-bold">
            Search Jobs
          </Button>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <div className="flex">
            <span className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary text-[10px] font-bold text-primary-foreground">
              FA
            </span>
            <span className="-ml-2 flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary/80 text-[10px] font-bold text-primary-foreground">
              MS
            </span>
            <span className="-ml-2 flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary/60 text-[10px] font-bold text-primary-foreground">
              CO
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">892</span> roles from{" "}
            <span className="font-bold text-foreground">147</span> companies
          </span>
        </div>
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
          <Button
            size="lg"
            variant="outline"
            className="rounded-lg border-2 border-neutral-800 font-semibold text-neutral-800 hover:bg-neutral-100"
          >
            View More
          </Button>
        </div>
      </section>

      <section className="py-16">
        <h2 className="mb-8 text-3xl font-bold tracking-tight text-foreground">
          Find jobs for every type of work
        </h2>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map(({ label, icon, count }) => (
            <CategoryCard key={label} label={label} icon={icon} count={count} />
          ))}
        </div>
      </section>
    </div>
  );
}
