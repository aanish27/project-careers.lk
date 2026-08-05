import { logout } from "@web-app-features/auth/api/web-user-auth.actions";
import { ProfileNameForm } from "@web-app-features/auth/components/profile-name-form";
import { MyJobsList } from "@web-app-features/jobs/components/my-jobs-list";
import { SavedJobsList } from "@web-app-features/jobs/components/saved-jobs-list";
import { ApiError } from "@/lib/api-client";
import {
  fetchMyJobsRequest,
  fetchSavedJobsRequest,
} from "@web-app-lib/web-user-client";
import { fetchMyFreelanceProfileRequest } from "@web-app-lib/freelance-client";
import { verifyWebUserSession } from "@web-app-lib/web-user-session";
import { Button } from "@ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

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
  let myJobs, savedJobs, freelanceProfile;
  try {
    [myJobs, savedJobs, freelanceProfile] = await Promise.all([
      fetchMyJobsRequest(session.accessToken),
      fetchSavedJobsRequest(session.accessToken),
      fetchMyFreelanceProfileRequest(session.accessToken),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect(`/login?from=${encodeURIComponent("/profile")}`);
    }
    throw err;
  }

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
            nativeButton={false}
          />
        ) : (
          <Button
            render={<Link href="/company">Set up your company</Link>}
            nativeButton={false}
          />
        )}
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Freelance</h2>
        <div className="flex flex-wrap gap-2">
          {freelanceProfile ? (
            <Button
              variant="outline"
              render={
                <Link href="/freelance/profile/edit">
                  Manage your freelance profile
                </Link>
              }
              nativeButton={false}
            />
          ) : (
            <Button
              variant="outline"
              render={
                <Link href="/freelance/profile/edit">
                  Set up your freelance profile
                </Link>
              }
              nativeButton={false}
            />
          )}
          <Button
            render={<Link href="/freelance/gigs/new">Post a gig</Link>}
            nativeButton={false}
          />
        </div>
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
