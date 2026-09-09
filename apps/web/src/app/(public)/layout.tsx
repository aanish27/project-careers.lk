import { Footer } from "@web-app-components/footer";
import { LoginModal } from "@web-app-features/auth/components/login-modal";
import { WebUserProvider } from "@jobboard/providers/web-user-provider";
import { QueryProvider } from "@jobboard/providers/query-provider";
import { getWebUserSession } from "@web-app-lib/web-user-session";
import { ReactNode } from "react";

export default async function layout({ children }: { children: ReactNode }) {
  const session = await getWebUserSession();

  return (
    <WebUserProvider initialUser={session?.user ?? null}>
      <QueryProvider>
        <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
          {children}
          <Footer />
        </div>
        <LoginModal />
      </QueryProvider>
    </WebUserProvider>
  );
}
