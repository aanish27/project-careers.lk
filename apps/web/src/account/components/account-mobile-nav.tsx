"use client";

import { Drawer, DrawerContent, DrawerTitle } from "@ui/drawer";
import { buttonVariants } from "@ui/button";
import { cn } from "@utils/utils";
import { accountSections } from "@account-config/icon-sidebar-links";
import { accountSidebarLinks } from "@account-config/sidebar-links";
import { useAccountSidebarContext } from "@account-hooks/use-sidebar-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import _ from "lodash";

export function AccountMobileNav() {
  const { isMobileNavOpen, setMobileNavOpen } = useAccountSidebarContext();
  const pathname = usePathname();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  return (
    <Drawer
      open={isMobileNavOpen}
      onOpenChange={setMobileNavOpen}
      swipeDirection="left"
    >
      <DrawerContent className="w-72 gap-4 p-4 md:hidden">
        <DrawerTitle className="text-sm">Menu</DrawerTitle>
        <nav className="flex flex-col gap-4 overflow-y-auto">
          {accountSections.map((section) => {
            const items = _.get(
              _.find(accountSidebarLinks, { moduleName: section.moduleName }),
              "sections[0].items",
              [],
            );
            return (
              <div key={section.moduleName} className="flex flex-col gap-1">
                <h3 className="text-muted-foreground px-3 text-xs font-bold tracking-wider uppercase">
                  {section.label}
                </h3>
                {items.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={buttonVariants({
                      variant: "ghost",
                      className: cn(
                        "flex justify-start gap-2 rounded-md text-xs font-medium",
                        pathname === href
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-foreground hover:bg-accent/50",
                      ),
                    })}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
