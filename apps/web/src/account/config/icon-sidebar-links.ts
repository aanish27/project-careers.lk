import {
  IconBriefcase,
  IconBuildingSkyscraper,
  IconUser,
  IconUserSearch,
} from "@tabler/icons-react";

export type AccountModule = "profile" | "jobs" | "company" | "freelance";

export interface AccountIconSidebarSection {
  label: string;
  moduleName: AccountModule;
  icon: typeof IconBuildingSkyscraper;
  href: string;
}

export const accountSections: AccountIconSidebarSection[] = [
  {
    label: "Profile",
    moduleName: "profile",
    icon: IconUser,
    href: "/account",
  },
  {
    label: "Jobs",
    moduleName: "jobs",
    icon: IconBriefcase,
    href: "/account/jobs/posted",
  },
  {
    label: "Company",
    moduleName: "company",
    icon: IconBuildingSkyscraper,
    href: "/account/company",
  },
  {
    label: "Freelance",
    moduleName: "freelance",
    icon: IconUserSearch,
    href: "/account/freelance/messages",
  },
];

/**
 * End-user URLs are flat (/account, /account/company, /account/jobs/...)
 * unlike admin's /admin/<module>/... shape, so the active module can't be
 * derived from path-segment slicing — it needs an explicit lookup instead.
 */
export function moduleForPath(pathname: string): AccountModule | null {
  if (pathname === "/account") return "profile";
  if (pathname === "/account/company") return "company";
  if (pathname === "/account/post-job") return "jobs";
  if (pathname.startsWith("/account/jobs/")) return "jobs";
  if (pathname.startsWith("/account/freelance/")) return "freelance";
  return null;
}
