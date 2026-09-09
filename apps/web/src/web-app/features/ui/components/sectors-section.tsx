import { slugify } from "@careerslk/lib/slugify";
import { getCategoriesForSector, SECTORS } from "@careerslk/types";
import {
  IconBriefcase,
  IconBuildingSkyscraper,
  IconCalculator,
  IconCode,
  IconHeadset,
  IconPencil,
  IconSpeakerphone,
  IconStethoscope,
  IconToolsKitchen2,
  TablerIcon,
} from "@tabler/icons-react";
import CategoryCard from "../../jobs/components/category/category-card";

const HOME_SECTORS: { sector: (typeof SECTORS)[number]; icon: TablerIcon }[] = [
  { sector: "IT & Software", icon: IconCode },
  { sector: "Engineering & Construction", icon: IconBuildingSkyscraper },
  { sector: "Finance & Accounting", icon: IconCalculator },
  { sector: "Sales & Marketing", icon: IconSpeakerphone },
  { sector: "Administration & Management", icon: IconBriefcase },
  { sector: "Customer Service & Support", icon: IconHeadset },
  { sector: "Healthcare & Medical", icon: IconStethoscope },
  { sector: "Hospitality & Tourism", icon: IconToolsKitchen2 },
  { sector: "Media, Communications & Creative", icon: IconPencil },
];

export const SectorsSection = () => {
  return (
    <section className="flex flex-col gap-10 py-16">
      <div className="text-left">
        <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
          Find jobs for every type of work
        </h2>
        <p className="text-lg text-muted-foreground">
          From software to hospitality, browse by what you do.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:auto-rows-38 lg:grid-cols-4">
        {HOME_SECTORS.map(({ sector, icon }, index) => (
          <CategoryCard
            key={sector}
            href={`/jobs/sector/${slugify(sector)}`}
            icon={icon}
            label={sector}
            count={`${getCategoriesForSector(sector).length} specializations`}
            featured={index === 0}
          />
        ))}
      </div>
    </section>
  );
};
