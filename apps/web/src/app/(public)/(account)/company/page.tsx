import { AutoApprovalStatus } from "@web-app-features/company/components/auto-approval-status";
import { CompanyForm } from "@web-app-features/company/components/company-form";
import { CompanyLogoUpload } from "@web-app-features/company/components/company-logo-upload";
import { CompanySetup } from "@web-app-features/company/components/company-setup";
import { fetchMyCompanyRequest } from "@web-app-lib/web-user-client";
import { verifyWebUserSession } from "@web-app-lib/web-user-session";

export default async function CompanyPage() {
  const session = await verifyWebUserSession();
  const company = await fetchMyCompanyRequest(session.accessToken);

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
