import { ApiError } from "@/lib/api-client";
import { AutoApprovalStatus } from "@web-app-features/company/components/auto-approval-status";
import { CompanyBrUpload } from "@web-app-features/company/components/company-br-upload";
import { CompanyForm } from "@web-app-features/company/components/company-form";
import { CompanyLogoUpload } from "@web-app-features/company/components/company-logo-upload";
import { CompanySetup } from "@web-app-features/company/components/company-setup";
import { fetchMyCompanyRequest } from "@web-app-lib/web-user-client";
import { verifyWebUserSession } from "@web-app-lib/web-user-session";
import { buttonVariants } from "@ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CompanyPage() {
  const session = await verifyWebUserSession();

  // See profile/page.tsx for why this doesn't try to refresh the token
  // itself — a 401 here just means it expired mid-session.
  let company;
  try {
    company = await fetchMyCompanyRequest(session.accessToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect(`/login?from=${encodeURIComponent("/account/company")}`);
    }
    throw err;
  }

  if (!company) {
    return (
      <div>
        <h1 className="mb-2 text-xl font-semibold">Set up your company</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Link an existing company or create a new one before you can post jobs.
        </p>
        <CompanySetup />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Your company</h1>
          <Link href="/account/post-job" className={buttonVariants()}>
            Post a job
          </Link>
        </div>
        <CompanyLogoUpload
          logoUrl={company.logoUrl}
          companyName={company.name}
        />
      </div>
      <CompanyForm company={company} />
      <CompanyBrUpload brImageUrl={company.brImageUrl} />
      <AutoApprovalStatus status={company.autoApprovalStatus} />
    </div>
  );
}
