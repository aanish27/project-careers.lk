import { CvUpload } from "@/web-app/features/freelance/components/cv-upload";
import { FreelancerProfileForm } from "@/web-app/features/freelance/components/freelancer-profile-form";
import { PortfolioUpload } from "@/web-app/features/freelance/components/portfolio-upload";
import { fetchMyFreelanceProfile } from "@/web-app/features/freelance/api/freelance.actions";
import { verifyWebUserSession } from "@/web-app/lib/web-user-session";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Freelance Profile | careers.lk",
  robots: { index: false },
};

export default async function EditFreelancerProfilePage() {
  await verifyWebUserSession();
  const profile = await fetchMyFreelanceProfile();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Your freelance profile
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {profile
          ? "Editing an approved profile takes it offline again until it's re-approved."
          : "Create a profile to advertise yourself as available for hire."}
      </p>

      <FreelancerProfileForm profile={profile} />

      {profile && (
        <div className="mt-8 flex flex-col gap-4">
          <CvUpload currentCvUploaded={!!profile.cvFileKey} />
          <PortfolioUpload currentCount={profile.portfolioFileKeys.length} />
        </div>
      )}
    </div>
  );
}
