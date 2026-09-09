import { AccountShell } from "@account-components/account-shell";
import { AccountProviders } from "@account-components/account-providers";
import { LoginModal } from "@web-app-features/auth/components/login-modal";
import { WebUserProvider } from "@jobboard/providers/web-user-provider";
import { QueryProvider } from "@jobboard/providers/query-provider";
import { verifyWebUserSession } from "@web-app-lib/web-user-session";
import type { ReactNode } from "react";

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await verifyWebUserSession();

  return (
    <WebUserProvider initialUser={session.user}>
      <QueryProvider>
        <AccountProviders>
          <AccountShell>{children}</AccountShell>
        </AccountProviders>
        <LoginModal />
      </QueryProvider>
    </WebUserProvider>
  );
}
