import { ApiError } from "@/lib/api-client";
import { SavedJobsList } from "@web-app-features/jobs/components/saved-jobs-list";
import { fetchSavedJobsRequest } from "@web-app-lib/web-user-client";
import { verifyWebUserSession } from "@web-app-lib/web-user-session";
import { redirect } from "next/navigation";

export default async function SavedJobsPage() {
  const session = await verifyWebUserSession();

  let savedJobs;
  try {
    savedJobs = await fetchSavedJobsRequest(session.accessToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect(`/login?from=${encodeURIComponent("/account/jobs/saved")}`);
    }
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Saved jobs</h1>
      <SavedJobsList savedJobs={savedJobs} />
    </div>
  );
}
