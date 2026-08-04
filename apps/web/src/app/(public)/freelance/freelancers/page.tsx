import LandingGradient from "@/web-app/components/landing-gradient";
import { PrimaryNavbar } from "@/web-app/components/primary-navbar";
import FreelanceNavbar from "@/web-app/features/freelance/components/freelance-navbar";
import { FreelancerCard } from "@/web-app/features/freelance/components/freelancer-card";
import { freelancerProfilesApi } from "@/web-app/features/freelance/api/api";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Freelancers | careers.lk",
  description:
    "Browse freelance profiles across development, design, writing, marketing and more.",
  alternates: { canonical: "/freelance/freelancers" },
};

export default async function FreelancersPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; skill?: string }>;
}) {
  const { category, skill } = await searchParams;
  const profiles = await freelancerProfilesApi.list({ category, skill });

  return (
    <div className="relative flex min-h-screen flex-col">
      <LandingGradient />
      <div className="sticky top-5 z-50 flex flex-col gap-3">
        <PrimaryNavbar />
        <FreelanceNavbar />
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-16 pb-24">
        <h1 className="mb-6 text-3xl font-bold text-foreground">
          Browse freelancers
        </h1>
        {profiles.length === 0 ? (
          <p className="text-muted-foreground">
            No freelancers match this search yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile) => (
              <FreelancerCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
