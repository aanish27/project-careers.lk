import { ProfileNameForm } from "@web-app-features/auth/components/profile-name-form";
import { fetchMyFreelanceProfile } from "@web-app-features/freelance/api/freelance.actions";
import {
  STATUS_LABEL as JOB_STATUS_LABEL,
  STATUS_VARIANT as JOB_STATUS_VARIANT,
} from "@web-app-features/jobs/components/my-jobs-list";
import { ApiError } from "@/lib/api-client";
import {
  fetchMyCompanyRequest,
  fetchMyJobsRequest,
} from "@web-app-lib/web-user-client";
import { verifyWebUserSession } from "@web-app-lib/web-user-session";
import { Badge } from "@ui/badge";
import { buttonVariants } from "@ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@ui/card";
import { cn } from "@utils/utils";
import {
  IconBriefcase,
  IconBuilding,
  IconExternalLink,
  IconFileText,
} from "@tabler/icons-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const COMPANY_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

const AUTO_APPROVAL_LABEL: Record<string, string> = {
  NONE: "Not requested",
  REQUESTED: "Requested",
  GRANTED: "Granted",
  DENIED: "Denied",
};

const FREELANCE_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "destructive"
> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

const FREELANCE_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

// Enum values are SCREAMING_SNAKE_CASE (e.g. "FULL_TIME") — turn them into
// display text ("Full Time") instead of maintaining a separate label map.
function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function initialsFor(user: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((part) => part!.charAt(0))
    .join("");
  return (initials || user.email.charAt(0)).toUpperCase();
}

export default async function ProfilePage() {
  const session = await verifyWebUserSession();
  const { user } = session;
  const displayName = user.firstName ?? user.email;

  // `session.accessToken` is display-only and may be stale/expired —
  // verifyWebUserSession() never refreshes it (a refresh writes a cookie,
  // which Next.js only allows from a Server Action/Route Handler, not a
  // page render). A 401 here just means the token expired mid-session;
  // send the user back through login to get a fresh one rather than
  // crashing with an uncaught ApiError.
  let company;
  let jobs;
  try {
    [company, jobs] = await Promise.all([
      user.companyId
        ? fetchMyCompanyRequest(session.accessToken)
        : Promise.resolve(null),
      fetchMyJobsRequest(session.accessToken),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect(`/login?from=${encodeURIComponent("/account")}`);
    }
    throw err;
  }
  const freelanceProfile = await fetchMyFreelanceProfile();

  return (
    <div className="flex flex-col gap-6">
      <Card size="sm">
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
              {initialsFor(user)}
            </span>
            <div>
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <ProfileNameForm
            firstName={user.firstName}
            lastName={user.lastName}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBuilding className="h-4 w-4 text-primary" />
            Company Information
          </CardTitle>
          {company && (
            <CardAction>
              <Badge
                variant={company.status === "ACTIVE" ? "success" : "outline"}
              >
                {COMPANY_STATUS_LABEL[company.status] ?? company.status}
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          {company ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Company Name
                </p>
                <p className="text-sm font-semibold">{company.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Website
                </p>
                {company.websiteUrl ? (
                  <a
                    href={company.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {company.websiteUrl}
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">Not set</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Auto-Approval
                </p>
                <p className="text-sm font-semibold">
                  {AUTO_APPROVAL_LABEL[company.autoApprovalStatus] ??
                    company.autoApprovalStatus}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Manage
                </p>
                <Link
                  href="/account/company"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Edit company
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Set up your company profile to start posting jobs.
              </p>
              <Link href="/account/company" className={buttonVariants()}>
                Set up your company
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBriefcase className="h-4 w-4 text-primary" />
            Freelance Profile
          </CardTitle>
          {freelanceProfile && (
            <CardAction>
              <Badge
                variant={
                  FREELANCE_STATUS_VARIANT[freelanceProfile.approvalStatus]
                }
              >
                {FREELANCE_STATUS_LABEL[freelanceProfile.approvalStatus]}
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          {freelanceProfile ? (
            <div className="flex flex-col gap-2">
              {freelanceProfile.bio && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {freelanceProfile.bio}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {freelanceProfile.rate != null && (
                  <span className="font-medium">
                    {freelanceProfile.rateCurrency ?? ""}{" "}
                    {freelanceProfile.rate}
                  </span>
                )}
                {freelanceProfile.category && (
                  <span className="text-muted-foreground">
                    {freelanceProfile.category}
                  </span>
                )}
              </div>
              <Link
                href="/account/freelance/profile/edit"
                className="text-sm font-medium text-primary hover:underline"
              >
                Manage profile
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                You are currently open to freelance opportunities. Prospective
                clients can view your portfolio and request project proposals.
              </p>
              <Link
                href="/account/freelance/profile/edit"
                className={buttonVariants()}
              >
                Set up your freelance profile
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileText className="h-4 w-4 text-primary" />
            My Job Postings
          </CardTitle>
          <CardAction>
            <Link
              href="/account/jobs/posted"
              className="text-sm font-medium text-primary hover:underline"
            >
              View All
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t posted any jobs yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {jobs.slice(0, 3).map((job) => {
                const isWithdrawn = job.deletedAt !== null;
                return (
                  <li
                    key={job.id}
                    className={cn(
                      "flex items-center justify-between gap-3 py-3",
                      "first:pt-0 last:pb-0",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {job.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[
                          job.company.name,
                          job.employmentType &&
                            formatEnumLabel(job.employmentType),
                          job.workMode && formatEnumLabel(job.workMode),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {!isWithdrawn && job.approvalStatus === "APPROVED" && (
                        <Link
                          href={`/job/${job.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View ${job.title}`}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <IconExternalLink className="h-4 w-4" />
                        </Link>
                      )}
                      {isWithdrawn ? (
                        <Badge variant="outline">Withdrawn</Badge>
                      ) : (
                        <Badge
                          variant={
                            JOB_STATUS_VARIANT[job.approvalStatus] ?? "outline"
                          }
                        >
                          {JOB_STATUS_LABEL[job.approvalStatus] ??
                            job.approvalStatus}
                        </Badge>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
