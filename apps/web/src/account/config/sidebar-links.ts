import {
  Bookmark,
  Briefcase,
  Building2,
  FileText,
  MessageSquare,
  User,
  UserSearch,
} from "lucide-react";
import type { ComponentType } from "react";
import type { AccountModule } from "./icon-sidebar-links";

export interface AccountSidebarItem {
  label: string;
  icon: ComponentType<{ className?: string }>;
  href: string;
}

export interface AccountSidebarSection {
  title: string;
  items: AccountSidebarItem[];
}

interface AccountSidebarLinks {
  moduleName: AccountModule;
  sections: AccountSidebarSection[];
}

export const accountSidebarLinks: AccountSidebarLinks[] = [
  {
    moduleName: "profile",
    sections: [
      {
        title: "Profile",
        items: [{ label: "Overview", icon: User, href: "/account" }],
      },
    ],
  },
  {
    moduleName: "jobs",
    sections: [
      {
        title: "Jobs",
        items: [
          {
            label: "Posted Jobs",
            icon: Briefcase,
            href: "/account/jobs/posted",
          },
          {
            label: "Saved Jobs",
            icon: Bookmark,
            href: "/account/jobs/saved",
          },
        ],
      },
    ],
  },
  {
    moduleName: "company",
    sections: [
      {
        title: "Company",
        items: [
          {
            label: "Company Profile",
            icon: Building2,
            href: "/account/company",
          },
        ],
      },
    ],
  },
  {
    moduleName: "freelance",
    sections: [
      {
        title: "Freelance",
        items: [
          {
            label: "Freelance Profile",
            icon: UserSearch,
            href: "/account/freelance/profile/edit",
          },
          {
            label: "Post a Gig",
            icon: FileText,
            href: "/account/freelance/gigs/new",
          },
          {
            label: "Messages",
            icon: MessageSquare,
            href: "/account/freelance/messages",
          },
        ],
      },
    ],
  },
];
