"use client";

import { SidebarSection } from "@dashboard-config/sidebar-links";
import { useAuth } from "@dashboard-hooks/use-auth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@ui/accordion";
import { buttonVariants } from "@ui/button";
import { cn } from "@utils/utils";
import Link from "next/link";
import { useState } from "react";
import { SidebarSearch } from "./sidebar-search";

interface SidebarProps {
  sections: SidebarSection[];
  activeItem?: string;
  sectionTitle: string;
}

export function SidebarMenu({
  sections,
  activeItem,
  sectionTitle,
}: SidebarProps) {
  const { can } = useAuth();
  const [prevSections, setPrevSections] = useState(sections);
  const [openSections, setOpenSections] = useState<string[]>(() =>
    sections.map((section) => section.title),
  );

  if (sections !== prevSections) {
    setPrevSections(sections);
    setOpenSections(sections.map((section) => section.title));
  }

  return (
    <aside className="bg-background flex flex-col rounded-lg shadow-lg">
      <div className="p-4">
        <h2 className="text-foreground text-xs font-bold tracking-wider uppercase">
          {sectionTitle}
        </h2>
      </div>

      <nav className="w-full flex-1 overflow-y-auto px-1">
        {sectionTitle === "search" ? (
          <SidebarSearch />
        ) : (
          <Accordion
            multiple
            value={openSections}
            onValueChange={setOpenSections}
          >
            {sections.map((section) => {
              const visibleItems = section.items.filter(
                (item) => !item.permission || can(item.permission),
              );

              if (visibleItems.length === 0) return null;

              return (
                <AccordionItem
                  key={section.title}
                  value={section.title}
                  className="border-none"
                >
                  <AccordionTrigger className="text-foreground hover:bg-accent/50 rounded-md px-3 py-2 text-xs font-semibold capitalize hover:no-underline">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    {visibleItems.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className={buttonVariants({
                          variant: "ghost",
                          className: cn(
                            "flex justify-start gap-2 rounded-md text-xs font-medium transition-all",
                            activeItem === label
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                              : "text-foreground hover:bg-accent/50",
                          ),
                        })}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="capitalize">{label}</span>
                      </Link>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {/* {searchOpen && searchQuery && (
          <div className="space-y-0.5 px-2 py-3">
            {sections
              .flatMap((s) => s.items)
              .filter((item) =>
                item.label.toLowerCase().includes(searchQuery.toLowerCase()),
              )
              .map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    onNavigate?.(item.href, "SEARCH");
                    setSearchOpen(false);
                  }}
                  className="text-foreground hover:bg-accent/50 flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-all"
                >
                  <span className="h-4 w-4 flex-shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
          </div>
        )} */}
      </nav>
    </aside>
  );
}
