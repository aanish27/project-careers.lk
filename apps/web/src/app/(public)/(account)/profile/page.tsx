import { Button } from "@ui/button";
import { logout } from "@web-app-features/auth/api/web-user-auth.actions";
import { verifyWebUserSession } from "@web-app-lib/web-user-session";

export default async function ProfilePage() {
  const session = await verifyWebUserSession();
  const { user } = session;
  const displayName = user.firstName ?? user.email;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-semibold">Welcome, {displayName}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <form action={logout}>
          <Button type="submit" variant="outline">
            Log out
          </Button>
        </form>
      </div>
    </div>
  );
}
