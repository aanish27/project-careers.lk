import { Button } from "@ui/button";
import { PostJobForm } from "@web-app-features/post-job/components/post-job-form";
import { verifyWebUserSession } from "@web-app-lib/web-user-session";
import Link from "next/link";

export default async function PostJobPage() {
  const session = await verifyWebUserSession();

  if (!session.user.companyId) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Set up your company first</h1>
        <p className="text-sm text-muted-foreground">
          You need a linked company before you can post a job. Create a new
          company profile or claim an existing one.
        </p>
        <Button render={<Link href="/company">Set up your company</Link>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-10">
      <h1 className="mb-6 text-xl font-semibold">Post a job</h1>
      <PostJobForm />
    </div>
  );
}
