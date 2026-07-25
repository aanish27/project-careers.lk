import type { PermissionKey } from "@careerslk/types";
import { PERMISSIONS } from "@careerslk/types";
import { IconBuildingSkyscraper, IconUsersGroup } from "@tabler/icons-react";

export interface IconSidebarSection {
  label: string;
  icon: typeof IconBuildingSkyscraper;
  href: string;
  /** Omit to always show — only gate sections backed by a real permission. */
  permission?: PermissionKey;
}

export const sections: IconSidebarSection[] = [
  {
    label: "company",
    icon: IconBuildingSkyscraper,
    href: "admin/company",
  },
  {
    label: "users",
    icon: IconUsersGroup,
    href: "admin/users",
    permission: PERMISSIONS.USERS_READ,
  },
  // {
  //   label: 'Dashboard',
  //   icon: LayoutDashboard,
  //   href: 'dashboard',
  // },
  // {
  //   label: 'Vendors',
  //   icon: UserRoundCog,
  //   href: 'vendors',
  // },
  // {
  //   label: 'Shops',
  //   icon: Store,
  //   href: 'shops',
  // },
];
