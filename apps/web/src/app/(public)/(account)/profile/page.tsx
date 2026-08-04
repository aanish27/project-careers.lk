import { logout } from "@web-app-features/auth/api/web-user-auth.actions";
import { ProfileNameForm } from "@web-app-features/auth/components/profile-name-form";
import { MyJobsList } from "@web-app-features/jobs/components/my-jobs-list";
import { SavedJobsList } from "@web-app-features/jobs/components/saved-jobs-list";
import {
  fetchMyJobsRequest,
  fetchSavedJobsRequest,
} from "@web-app-lib/web-user-client";
import { verifyWebUserSession } from "@web-app-lib/web-user-session";
import { Button } from "@ui/button";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await verifyWebUserSession();
  const { user } = session;
  const displayName = user.firstName ?? user.email;

  const [myJobs, savedJobs] = await Promise.all([
    fetchMyJobsRequest(session.accessToken),
    fetchSavedJobsRequest(session.accessToken),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10 py-10">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">Welcome, {displayName}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <ProfileNameForm firstName={user.firstName} lastName={user.lastName} />
        <form action={logout}>
          <Button type="submit" variant="outline">
            Log out
          </Button>
        </form>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Company</h2>
        {user.companyId ? (
          <Button
            variant="outline"
            render={<Link href="/company">Manage your company</Link>}
          />
        ) : (
          <Button render={<Link href="/company">Set up your company</Link>} />
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">My job postings</h2>
        <MyJobsList jobs={myJobs} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Saved jobs</h2>
        <SavedJobsList savedJobs={savedJobs} />
      </div>
    </div>
  );
}
