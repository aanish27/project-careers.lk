import { ApiError } from "@/lib/api-client";
import { AutoApprovalStatus } from "@web-app-features/company/components/auto-approval-status";
import { CompanyForm } from "@web-app-features/company/components/company-form";
import { CompanyLogoUpload } from "@web-app-features/company/components/company-logo-upload";
import { CompanySetup } from "@web-app-features/company/components/company-setup";
import { fetchMyCompanyRequest } from "@web-app-lib/web-user-client";
import { verifyWebUserSession } from "@web-app-lib/web-user-session";
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
      redirect(`/login?from=${encodeURIComponent("/company")}`);
    }
    throw err;
  }

  if (!company) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <h1 className="mb-2 text-xl font-semibold">Set up your company</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Link an existing company or create a new one before you can post jobs.
        </p>
        <CompanySetup />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 py-10">
      <div>
        <h1 className="mb-4 text-xl font-semibold">Your company</h1>
        <CompanyLogoUpload
          logoUrl={company.logoUrl}
          companyName={company.name}
        />
      </div>
      <CompanyForm company={company} />
      <AutoApprovalStatus status={company.autoApprovalStatus} />
    </div>
  );
}
