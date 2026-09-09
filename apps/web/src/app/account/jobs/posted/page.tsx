import { ApiError } from "@/lib/api-client";
import { MyJobsList } from "@web-app-features/jobs/components/my-jobs-list";
import { fetchMyJobsRequest } from "@web-app-lib/web-user-client";
import { verifyWebUserSession } from "@web-app-lib/web-user-session";
import { redirect } from "next/navigation";

export default async function PostedJobsPage() {
  const session = await verifyWebUserSession();

  let myJobs;
  try {
    myJobs = await fetchMyJobsRequest(session.accessToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect(`/login?from=${encodeURIComponent("/account/jobs/posted")}`);
    }
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">My job postings</h1>
      <MyJobsList jobs={myJobs} />
    </div>
  );
}
