import { DashboardShell } from "@dashboard-components/dashboard-shell";
import DashboardProviders from "@dashboard-components/dashboard-providers";
import { AuthProvider } from "@dashboard-components/auth-provider";
import { verifySession } from "@dashboard-lib/session";
import { Toaster } from "@/components/ui/sonner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  return (
    <AuthProvider user={session.user}>
      <DashboardProviders>
        <DashboardShell>{children}</DashboardShell>
        <Toaster />
      </DashboardProviders>
    </AuthProvider>
  );
}
