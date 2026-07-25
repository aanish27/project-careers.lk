"use client";

import type { PermissionCatalogEntry, PermissionGroup } from "@careerslk/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@dashboard-hooks/use-auth";

export function PermissionPicker({
  groups,
  selected,
  onToggle,
  roleHeldKeys,
}: {
  groups: PermissionGroup[];
  selected: Set<number>;
  onToggle: (permissionId: number) => void;
  /** Keys the role already holds — grantable even if the actor lacks them. */
  roleHeldKeys: Set<string>;
}) {
  const { user: actor } = useAuth();

  const isLocked = (entry: PermissionCatalogEntry) =>
    !actor.isSuperAdmin &&
    !actor.permissions.includes(entry.key) &&
    !roleHeldKeys.has(entry.key);

  return (
    <Accordion multiple className="w-full">
      {groups.map((group) => {
        const allSelected = group.permissions.every((p) => selected.has(p.id));
        const anyLocked = group.permissions.some(isLocked);

        return (
          <AccordionItem key={group.module} value={group.module}>
            <AccordionTrigger className="capitalize">
              {group.module}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`module-${group.module}`}
                  checked={allSelected}
                  disabled={anyLocked && !allSelected}
                  onCheckedChange={() => {
                    for (const entry of group.permissions) {
                      if (isLocked(entry)) continue;
                      if (allSelected) {
                        if (selected.has(entry.id)) onToggle(entry.id);
                      } else if (!selected.has(entry.id)) {
                        onToggle(entry.id);
                      }
                    }
                  }}
                />
                <Label
                  htmlFor={`module-${group.module}`}
                  className="font-medium"
                >
                  Select all in {group.module}
                </Label>
              </div>
              {group.permissions.map((entry) => {
                const locked = isLocked(entry);
                const checkbox = (
                  <div key={entry.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`permission-${entry.id}`}
                      checked={selected.has(entry.id)}
                      disabled={locked}
                      onCheckedChange={() => onToggle(entry.id)}
                    />
                    <Label htmlFor={`permission-${entry.id}`}>
                      {entry.description ?? entry.key}
                    </Label>
                  </div>
                );

                if (!locked) return checkbox;

                return (
                  <Tooltip key={entry.id}>
                    <TooltipTrigger render={checkbox} />
                    <TooltipContent>
                      You cannot grant a permission you do not hold yourself.
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
