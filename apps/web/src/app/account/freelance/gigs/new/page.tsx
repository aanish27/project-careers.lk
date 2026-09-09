import { GigForm } from "@/web-app/features/freelance/components/gig-form";
import { verifyWebUserSession } from "@/web-app/lib/web-user-session";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post a Gig | careers.lk",
  robots: { index: false },
};

export default async function NewGigPage() {
  await verifyWebUserSession();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Post a gig</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Your gig will be reviewed by an admin before it&apos;s publicly listed.
      </p>
      <GigForm />
    </div>
  );
}
