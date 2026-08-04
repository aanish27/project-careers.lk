import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LandingGradient from "@/web-app/components/landing-gradient";
import { PrimaryNavbar } from "@/web-app/components/primary-navbar";
import FreelanceNavbar from "@/web-app/features/freelance/components/freelance-navbar";
import { FREELANCE_CATEGORIES } from "@careerslk/types";
import {
  IconCalculator,
  IconCode,
  IconHeadset,
  IconPencil,
  IconScale,
  IconSearch,
  IconSpeakerphone,
  IconStarFilled,
} from "@tabler/icons-react";
import Link from "next/link";

const POPULAR_SEARCHES = [
  "Website Design",
  "Mobile App Development",
  "Logo Design",
  "WordPress",
  "Voice Over",
  "Data Entry",
  "Social Media Marketing",
];

// Icons keyed by the shared FREELANCE_CATEGORY_TAXONOMY labels (single
// source of truth in @careerslk/types) — falls back to IconCode for any
// category added there without a matching icon here.
const CATEGORY_ICONS: Record<string, typeof IconCode> = {
  "Development & IT": IconCode,
  "Design & Creative": IconPencil,
  "Sales & Marketing": IconSpeakerphone,
  "Writing & Translation": IconPencil,
  "Admin & Support": IconHeadset,
  "Finance & Accounting": IconCalculator,
  Legal: IconScale,
  "Engineering & Architecture": IconCode,
};

export default function FreelancePage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <LandingGradient />
      <div className="sticky top-5 z-50 flex flex-col gap-3">
        <PrimaryNavbar />
        <FreelanceNavbar />
      </div>

      <main className="flex flex-1 flex-col items-center pt-16 text-center">
        <Badge
          variant="secondary"
          className="mb-5 h-7 rounded-full px-4 text-sm"
        >
          <IconStarFilled className="size-3.5 text-primary" />
          Trusted by 12,000+ businesses across Sri Lanka
        </Badge>

        <div className="mb-4 max-w-3xl text-6xl font-extrabold tracking-tight text-foreground">
          Find the freelancers needed to get your business growing.
        </div>
        <div className="mb-8 max-w-xl text-lg text-muted-foreground">
          Hire skilled freelancers for any project, from web development to
          brand design, delivered on your timeline and budget.
        </div>

        <div className="flex w-full max-w-2xl items-center gap-2 rounded-full border border-border bg-white p-2 shadow-sm">
          <IconSearch className="ml-3 size-5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Try 'building a mobile app'"
            className="w-full flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
          />
          <Button size="lg" className="rounded-full font-bold">
            Search
          </Button>
        </div>

        <div className="mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-2 text-sm">
          <span className="font-semibold text-foreground">Popular:</span>
          {POPULAR_SEARCHES.map((term) => (
            <Badge
              key={term}
              variant="outline"
              render={<button type="button" />}
              className="h-7 cursor-pointer rounded-full bg-white px-3 text-sm font-medium hover:bg-muted"
            >
              {term}
            </Badge>
          ))}
        </div>

        <div className="mt-16 grid w-full max-w-5xl grid-cols-2 gap-4 pb-24 sm:grid-cols-3 lg:grid-cols-4">
          {FREELANCE_CATEGORIES.map((label) => {
            const Icon = CATEGORY_ICONS[label] ?? IconCode;
            return (
              <Link
                key={label}
                href={`/freelance/freelancers?category=${encodeURIComponent(label)}`}
                className="flex cursor-pointer flex-col items-start gap-4 rounded-2xl border border-border bg-white p-5 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="font-semibold text-foreground">{label}</span>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
