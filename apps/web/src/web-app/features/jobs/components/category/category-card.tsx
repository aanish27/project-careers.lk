import { cn } from "@/lib/utils";
import { IconArrowUpRight, TablerIcon } from "@tabler/icons-react";
import Link from "next/link";

type CategoryCardProps = {
  icon: TablerIcon;
  label: string;
  count: string;
  href: string;
  featured?: boolean;
};

const CategoryCard = ({
  icon: Icon,
  label,
  count,
  href,
  featured,
}: CategoryCardProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        featured
          ? "border-primary bg-primary text-primary-foreground sm:col-span-2 sm:row-span-2"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-xl",
            featured ? "bg-white/15" : "bg-primary/10",
          )}
        >
          <Icon
            className={cn(
              "size-6",
              featured ? "text-primary-foreground" : "text-primary",
            )}
            stroke={1.75}
          />
        </span>
        <IconArrowUpRight
          className={cn(
            "size-5 -translate-x-1 translate-y-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100",
            featured ? "text-primary-foreground" : "text-foreground",
          )}
        />
      </div>
      <div className={cn("mt-6", featured && "sm:mt-auto")}>
        <p
          className={cn(
            "font-semibold leading-snug",
            featured ? "text-xl" : "text-foreground",
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "mt-1 text-sm",
            featured ? "text-primary-foreground/75" : "text-muted-foreground",
          )}
        >
          {count}
        </p>
      </div>
    </Link>
  );
};

export default CategoryCard;
