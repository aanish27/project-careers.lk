import type { PermissionKey } from "@careerslk/lib";
import { PERMISSIONS } from "@careerslk/lib";
import {
  BarChart,
  Bell,
  Box,
  Building2,
  CreditCard,
  FileText,
  FolderOpen,
  Key,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  Truck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

interface SidebarItem {
  label: string;
  icon: LucideIcon;
  href: string;
  /** Omit to always show — only gate items backed by a real permission. */
  permission?: PermissionKey;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface SidebarLinks {
  moduleName: string;
  sections: SidebarSection[];
}

export const sidebarLinks: SidebarLinks[] = [
  {
    moduleName: "company",
    sections: [
      {
        title: "Manage",
        items: [
          {
            label: "Companies",
            icon: Building2,
            href: "/admin/company",
            permission: PERMISSIONS.COMPANIES_READ,
          },
          {
            label: "Overview",
            icon: LayoutDashboard,
            href: "/admin/company/overview",
            permission: PERMISSIONS.COMPANIES_READ,
          },
        ],
      },
    ],
  },
  {
    moduleName: "search",
    sections: [
      {
        title: "example",
        items: [
          {
            label: "example",
            icon: LayoutDashboard,
            href: "/example",
          },
        ],
      },
    ],
  },
  {
    moduleName: "vendors",
    sections: [
      {
        title: "overview",
        items: [
          {
            label: "dashboard",
            icon: LayoutDashboard,
            href: "/vendors",
          },
          { label: "products", icon: Box, href: "/vendors/products" },
        ],
      },
      {
        title: "manage",
        items: [
          { label: "Projects", icon: FolderOpen, href: "/vendors/projects" },
          {
            label: "Notifications",
            icon: Bell,
            href: "/vendors/notifications",
          },
          { label: "Integrations", icon: Zap, href: "/vendors/integrations" },
        ],
      },
    ],
  },
  {
    moduleName: "shops",
    sections: [
      {
        title: "manage",
        items: [
          { label: "Overview", icon: LayoutDashboard, href: "/shops/overview" },
          { label: "Products", icon: Package, href: "/shops/products" },
          { label: "Orders", icon: ShoppingCart, href: "/shops/orders" },
        ],
      },
      {
        title: "settings",
        items: [
          { label: "Payments", icon: CreditCard, href: "/shops/payments" },
          { label: "Shipping", icon: Truck, href: "/shops/shipping" },
          { label: "Integrations", icon: Zap, href: "/shops/integrations" },
        ],
      },
    ],
  },
  {
    moduleName: "users",
    sections: [
      {
        title: "manage",
        items: [
          {
            label: "All Users",
            icon: Users,
            href: "/admin/users",
            permission: PERMISSIONS.USERS_READ,
          },
          {
            label: "Roles",
            icon: Shield,
            href: "/admin/users/roles",
            permission: PERMISSIONS.ROLES_READ,
          },
          {
            label: "Permissions",
            icon: Key,
            href: "/admin/users/permissions",
            permission: PERMISSIONS.PERMISSIONS_READ,
          },
        ],
      },
      // Logs/Notifications have no backing pages yet — left commented out
      // rather than linking to routes that don't exist.
      // {
      //   title: 'Activity',
      //   items: [
      //     { label: 'Logs', icon: Accessibility, href: '/admin/users/logs' },
      //     { label: 'Notifications', icon: Bell, href: '/admin/users/notifications' },
      //   ],
      // },
    ],
  },
  {
    moduleName: "dashboard",
    sections: [
      {
        title: "Overview",
        items: [
          { label: "Home", icon: LayoutDashboard, href: "/dashboard" },
          { label: "Analytics", icon: BarChart, href: "/dashboard/analytics" },
          { label: "Reports", icon: FileText, href: "/dashboard/reports" },
        ],
      },
      {
        title: "System",
        items: [
          { label: "Settings", icon: Settings, href: "/dashboard/settings" },
          {
            label: "Notifications",
            icon: Bell,
            href: "/dashboard/notifications",
          },
        ],
      },
    ],
  },
];
