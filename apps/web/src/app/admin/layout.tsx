import { Button } from '@/components/ui/button';
import { logout } from '@/lib/actions/auth.actions';
import { getSession } from '@/lib/session';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <span className="font-medium">careers.lk Admin</span>
        {session && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user.firstName}
            </span>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
