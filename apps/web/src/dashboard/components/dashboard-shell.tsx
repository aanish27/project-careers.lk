"use client";
import { DashboardSidebar } from "@dashboard-components/dashboard-sidebar";
import { Topbar } from "@dashboard-components/topbar";
import { useSidebarContext } from "@dashboard-hooks/use-sidebar-context";
import { cn } from "@utils/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isSidebarOpen } = useSidebarContext();
  return (
    <div
      className={cn(
        "bg-accent grid h-screen gap-4 p-4 transition-all",
        isSidebarOpen ? "grid-cols-[64px_280px_1fr]" : "grid-cols-[64px_1fr]",
      )}
    >
      <DashboardSidebar />
      <div className="flex min-h-0 min-w-0 flex-col gap-3">
        <Topbar />
        <main className="bg-background h-full min-w-0 flex-1 overflow-y-auto rounded-lg">
          {children}
        </main>
      </div>
    </div>
  );
}
