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

type CategorySidebarProps = {
  activeCategory: string;
  headerHeight: number;
};

const CategorySidebar = ({
  activeCategory,
  headerHeight,
}: CategorySidebarProps) => {
  return (
    <aside
      className="sticky z-40 h-fit shrink-0 rounded-3xl border border-white/40 dark:border-white/10 bg-white/20 dark:bg-white/5 shadow-[0_1px_4px_rgba(31,38,135,0.15)] p-4"
      style={{ top: `calc(1.25rem + ${headerHeight}px + 0.75rem)` }}
    >
      <h3 className="mb-4 text-lg font-bold text-foreground">Sectors</h3>
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
