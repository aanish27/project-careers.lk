import { DestinationCard } from "@/components/ui/card-21";
import type { SeoLocationStat } from "@/web-app/features/seo/types";
import { slugify } from "@careerslk/lib/slugify";

const FEATURED_CITIES: {
  district: string;
  imageUrl: string;
  themeColor: string; // HSL triplet, e.g. "150 50% 25%"
}[] = [
  {
    district: "Colombo",
    imageUrl: "/cities/colombo.jpeg",
    themeColor: "217 91% 30%",
  },
  {
    district: "Kandy",
    imageUrl: "/cities/kandy.jpg",
    themeColor: "142 60% 25%",
  },
  {
    district: "Galle",
    imageUrl: "/cities/galle.jpg",
    themeColor: "199 80% 30%",
  },
  {
    district: "Jaffna",
    imageUrl: "/cities/jaffna.jpeg",
    themeColor: "35 80% 35%",
  },
];

export const FeaturedCities = ({
  locationStats = [],
}: {
  locationStats?: SeoLocationStat[];
}) => {
  return (
    <section className="flex flex-col gap-10 py-16">
      <div className="text-left">
        <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
          Featured cities
        </h2>
        <p className="text-lg text-muted-foreground">
          Explore openings in Sri Lanka&apos;s biggest job markets.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURED_CITIES.map(({ district, imageUrl, themeColor }) => {
          const count =
            locationStats.find((stat) => stat.district === district)?.count ??
            0;
          return (
            <div key={district} className="h-105">
              <DestinationCard
                imageUrl={imageUrl}
                location={district}
                stats={`${count.toLocaleString()} jobs`}
                href={`/jobs/in/${slugify(district)}`}
                themeColor={themeColor}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};
