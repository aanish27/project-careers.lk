"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { usePermissions } from "@dashboard-hooks/use-permissions";

export function PermissionCatalogue() {
  const { groups, isLoading } = usePermissions();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  return (
    <Accordion multiple className="w-full">
      {groups.map((group) => (
        <AccordionItem key={group.module} value={group.module}>
          <AccordionTrigger className="capitalize">
            {group.module}
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-2">
            {group.permissions.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-0.5">
                <span className="font-mono text-sm">{entry.key}</span>
                <span className="text-sm text-muted-foreground">
                  {entry.description}
                </span>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
