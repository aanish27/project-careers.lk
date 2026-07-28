import type { PermissionKey } from "@careerslk/lib";
import { PERMISSIONS } from "@careerslk/lib";
import {
  Bot,
  Briefcase,
  Building2,
  FileText,
  History,
  Key,
  Layers,
  LayoutDashboard,
  ListOrdered,
  Shield,
  Tag,
  Users,
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
    moduleName: "admin",
    sections: [
      {
        title: "Dashboards",
        items: [
          {
            label: "dashboard",
            icon: LayoutDashboard,
            href: "/admin",
            permission: PERMISSIONS.DASHBOARD_READ,
          },
          {
            label: "Company Overview",
            icon: Building2,
            href: "/admin/company/overview",
            permission: PERMISSIONS.COMPANIES_READ,
          },
          {
            label: "Jobs Overview",
            icon: Briefcase,
            href: "/admin/jobs/overview",
            permission: PERMISSIONS.JOBS_READ,
          },
          {
            label: "Logs Overview",
            icon: History,
            href: "/admin/logs",
          },
        ],
      },
    ],
  },
  {
    moduleName: "jobs",
    sections: [
      {
        title: "Manage",
        items: [
          {
            label: "All Jobs",
            icon: Briefcase,
            href: "/admin/jobs",
            permission: PERMISSIONS.JOBS_READ,
          },
          {
            label: "Keywords",
            icon: Tag,
            href: "/admin/jobs/keywords",
            permission: PERMISSIONS.KEYWORDS_READ,
          },
          {
            label: "Overview",
            icon: LayoutDashboard,
            href: "/admin/jobs/overview",
            permission: PERMISSIONS.JOBS_READ,
          },
        ],
      },
    ],
  },
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
    moduleName: "logs",
    sections: [
      {
        title: "Activity",
        items: [
          {
            label: "Overview",
            icon: LayoutDashboard,
            href: "/admin/logs",
          },
          {
            label: "Audit Logs",
            icon: FileText,
            href: "/admin/logs/audit",
            permission: PERMISSIONS.AUDIT_LOGS_READ,
          },
          {
            label: "Scrape Logs",
            icon: History,
            href: "/admin/logs/scrapes",
            permission: PERMISSIONS.SCRAPE_LOGS_READ,
          },
          {
            label: "AI Logs",
            icon: Bot,
            href: "/admin/logs/ai",
            permission: PERMISSIONS.AI_LOGS_READ,
          },
          {
            label: "AI Batch Logs",
            icon: Layers,
            href: "/admin/logs/ai-batches",
            permission: PERMISSIONS.AI_BATCH_LOGS_READ,
          },
          {
            label: "Queue Logs",
            icon: ListOrdered,
            href: "/admin/logs/queues",
            permission: PERMISSIONS.QUEUE_LOGS_READ,
          },
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
];
