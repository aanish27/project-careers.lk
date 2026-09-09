import { StatsCarousel } from "@/components/ui/stats-carousel";
import JobsSearchBar from "@/web-app/components/jobs-searchbar";
import Image from "next/image";
import Link from "next/link";
import { SeoSectorStat } from "../../seo/types";

const POPULAR_SEARCHES: { label: string; param: "title" | "location" }[] = [
  { label: "Software Engineer", param: "title" },
  { label: "Marketing", param: "title" },
  { label: "Accountant", param: "title" },
  { label: "Customer Support", param: "title" },
  { label: "Colombo", param: "location" },
];

const HERO_PHOTO = "/landing.png";

const JobsIntro = ({
  sectorStats,
  jobCount,
  companyCount,
}: {
  sectorStats: SeoSectorStat[];
  jobCount: number;
  companyCount: number;
}) => {
  return (
    <div className="h-screen">
      <main className="relative mt-10 overflow-hidden rounded-3xl bg-background ">
        <div className="absolute -right-70 top-1/2 size-180 -translate-y-1/2 rotate-[-70deg] rounded-[4rem] bg-[#012b52]" />
        <div className="relative grid grid-cols-1 items-center gap-12 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-2 lg:gap-10 lg:px-14 lg:py-24">
          <div className="flex flex-col items-start text-left">
            <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
              The job board built for Sri Lanka.
            </h1>
            <p className="mb-8 max-w-lg text-lg text-muted-foreground">
              Jobs across every industry, updated daily from official employer
              sources.
            </p>
            <JobsSearchBar />
            <div className="mt-5 flex flex-wrap items-center gap-2">
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

            <div className="flex items-center   py-4 gap-3 rounded-2xl  backdrop-blur-sm dark:bg-white/5">
              <span className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{jobCount}</span>{" "}
                roles from{" "}
                <span className="font-bold text-foreground">
                  {companyCount}
                </span>{" "}
                companies
              </span>
            </div>
          </div>
          <div className="flex relative min-h-88 sm:min-h-104 lg:min-h-120">
            <div className="absolute right-6 top-4 aspect-4/5 w-56 sm:left-10 sm:top-10 sm:w-64 lg:left-8 lg:w-72">
              <div className="relative -top-5 size-full overflow-hidden rounded-[2rem] shadow-2xl">
                <Image
                  src={HERO_PHOTO}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 40vw, 500px"
                  className="object-cover object-center"
                />
              </div>
              <StatsCarousel
                stats={sectorStats}
                className="absolute -bottom-10 -right-8 sm:-right-10 lg:-right-62"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JobsIntro;
