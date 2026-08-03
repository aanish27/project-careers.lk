import { TablerIcon } from "@tabler/icons-react";

type CategoryCardProps = {
  icon: TablerIcon;
  label: string;
  count: number;
};

const CategoryCard = ({ icon: Icon, label, count }: CategoryCardProps) => {
  return (
    <div className="flex cursor-pointer flex-col items-start gap-5 rounded-2xl border border-border bg-white p-6 text-left transition-colors hover:border-foreground/70">
      <Icon className="size-8 text-primary" stroke={1.75} />
      <div>
        <p className="font-semibold leading-snug text-foreground">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{count} jobs</p>
      </div>
    </div>
  );
};

export default CategoryCard;
