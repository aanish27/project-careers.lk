"use client";
import { AccountSidebar } from "@account-components/account-sidebar";
import { AccountTopbar } from "@account-components/account-topbar";
import { AccountMobileNav } from "@account-components/account-mobile-nav";

export function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto  px-8 border border-transparent rounded-2xl bg-accent grid h-screen grid-cols-1 gap-4 p-4 md:grid-cols-[280px_1fr]">
      <div className="hidden md:block">
        <AccountSidebar />
      </div>
      <div className="flex min-h-0  min-w-0 flex-col gap-3">
        <AccountTopbar />
        <main className="bg-background h-full min-w-0 flex-1 overflow-y-auto rounded-lg">
          <div className="mx-auto max-w-4xl px-6 py-10 md:px-8">{children}</div>
        </main>
      </div>
      <AccountMobileNav />
    </div>
  );
}
