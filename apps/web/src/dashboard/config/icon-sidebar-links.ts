import type { PermissionKey } from "@careerslk/lib";
import { PERMISSIONS } from "@careerslk/lib";
import {
  IconBriefcase,
  IconBuildingSkyscraper,
  IconLayoutDashboard,
  IconListDetails,
  IconSearch,
  IconUsersGroup,
  IconUserSearch,
} from "@tabler/icons-react";

export interface IconSidebarSection {
  label: string;
  icon: typeof IconBuildingSkyscraper;
  href: string;
  /** Omit to always show — only gate sections backed by a real permission. */
  permission?: PermissionKey;
}

export const sections: IconSidebarSection[] = [
  {
    label: "Dashboards",
    icon: IconLayoutDashboard,
    href: "admin",
    permission: PERMISSIONS.DASHBOARD_READ,
  },
  {
    label: "company",
    icon: IconBuildingSkyscraper,
    href: "admin/company",
    permission: PERMISSIONS.COMPANIES_READ,
  },
  {
    label: "users",
    icon: IconUsersGroup,
    href: "admin/users",
    permission: PERMISSIONS.USERS_READ,
  },
  {
    label: "jobs",
    icon: IconBriefcase,
    href: "admin/jobs",
    permission: PERMISSIONS.JOBS_READ,
  },
  {
    label: "freelance",
    icon: IconUserSearch,
    href: "admin/freelance",
    permission: PERMISSIONS.FREELANCE_PROFILES_READ,
  },
  {
    label: "SEO",
    icon: IconSearch,
    href: "admin/seo",
    permission: PERMISSIONS.SEO_READ,
  },
  {
    label: "Logs",
    icon: IconListDetails,
    href: "admin/logs",
  },
];
