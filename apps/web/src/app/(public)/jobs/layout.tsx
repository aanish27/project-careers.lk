import { PrimaryNavbar } from "@web-app-components/primary-navbar";
import CategorySidebar from "@web-app-features/jobs/components/category-sidebar";
import JobsNavbar from "@web-app-features/jobs/components/jobs-navbar";
import { ReactNode } from "react";

export default function JobsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-5 z-50 flex flex-col gap-3">
        <PrimaryNavbar />
        <JobsNavbar />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-5 gap-5 py-8">
        <CategorySidebar />
        <main className="col-span-4">{children}</main>
      </div>
    </div>
  );
}
