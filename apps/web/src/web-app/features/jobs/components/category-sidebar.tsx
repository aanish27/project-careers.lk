"use client";

import { slugify } from "@careerslk/lib/slugify";
import { SECTORS } from "@careerslk/types";
import {
  IconApps,
  IconBriefcase,
  IconBuildingFactory2,
  IconBuildingSkyscraper,
  IconCalculator,
  IconCode,
  IconHeadset,
  IconLayoutGrid,
  IconPencil,
  IconScale,
  IconSchool,
  IconShirt,
  IconSpeakerphone,
  IconStethoscope,
  IconToolsKitchen2,
  IconTruck,
  IconUsersGroup,
  type Icon,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTOR_ICONS: Record<string, Icon> = {
  "IT & Software": IconCode,
  "Engineering & Construction": IconBuildingSkyscraper,
  "Finance & Accounting": IconCalculator,
  "Sales & Marketing": IconSpeakerphone,
  "Human Resources": IconUsersGroup,
  "Administration & Management": IconBriefcase,
  "Customer Service & Support": IconHeadset,
  "Logistics, Warehouse & Transport": IconTruck,
  "Manufacturing & Production": IconBuildingFactory2,
  "Hospitality & Tourism": IconToolsKitchen2,
  "Healthcare & Medical": IconStethoscope,
  "Education & Training": IconSchool,
  "Media, Communications & Creative": IconPencil,
  Legal: IconScale,
  "Apparel & Fashion": IconShirt,
  "General Services": IconApps,
};

const CATEGORIES = [
  { label: "All Jobs", icon: IconLayoutGrid, href: "/jobs" },
  ...SECTORS.map((sector) => ({
    label: sector,
    icon: SECTOR_ICONS[sector] ?? IconApps,
    href: `/jobs/sector/${slugify(sector)}`,
  })),
];

const CategorySidebar = () => {
  const pathname = usePathname();
  const sectorSlug = pathname.match(/^\/jobs\/sector\/([^/]+)/)?.[1];
  const activeSector = sectorSlug
    ? SECTORS.find((sector) => slugify(sector) === sectorSlug)
    : undefined;
  const activeCategory = activeSector ?? "All Jobs";

  return (
    <aside className="w-full rounded-3xl min-h-0 h-fit border border-white/40 dark:border-white/10 bg-white/20 dark:bg-white/5 shadow-[0_1px_10px_rgba(31,38,135,0.15)] p-4">
      <h3
        className="mb-4 text-lg font-bold text-foreground"
        data-debug-pathname={pathname}
        data-debug-slug={sectorSlug}
        data-debug-active={activeCategory}
      >
        Sectors
      </h3>
      <div className="flex flex-col gap-3">
        {CATEGORIES.map(({ label, icon: Icon, href }) => {
          const isActive = activeCategory === label;
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-xl p-2 text-left text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : "text-foreground/80 hover:bg-muted"
              }`}
            >
              <Icon className="size-4.5 shrink-0" stroke={1.75} />
              {label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

export default CategorySidebar;
