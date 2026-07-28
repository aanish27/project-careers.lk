import { Badge } from "@/components/ui/badge";
import type { StatusMeta } from "@dashboard/utils/status-variant";

export function StatusPill({
  meta,
  label,
}: {
  meta: StatusMeta;
  label: string;
}) {
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant}>
      <Icon className="size-3" />
      {label}
    </Badge>
  );
}
