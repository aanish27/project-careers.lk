import { DashboardShell } from '@dashboard-components/dashboard-shell';
import DashboardProviders from '@dashboard-components/dashboard-providers';
import { verifySession } from '@dashboard-lib/session';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await verifySession();
  return (
    <DashboardProviders>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProviders>
  );
}
