import { PostJobForm } from "@web-app-features/post-job/components/post-job-form";
import { verifyWebUserSession } from "@web-app-lib/web-user-session";

export default async function PostJobPage() {
  const session = await verifyWebUserSession();

  return (
    <div className="mx-auto max-w-2xl py-10">
      <h1 className="mb-6 text-xl font-semibold">Post a job</h1>
      <PostJobForm hasCompany={!!session.user.companyId} />
    </div>
  );
}
