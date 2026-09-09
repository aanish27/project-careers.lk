"use client";

import { buttonVariants } from "@ui/button";
import { Collapsible, CollapsibleContent } from "@ui/collapsible";
import { cn } from "@utils/utils";
import { UserCircle } from "lucide-react";
import {
  accountSections,
  moduleForPath,
} from "@account-config/icon-sidebar-links";
import {
  accountSidebarLinks,
  type AccountSidebarItem,
} from "@account-config/sidebar-links";
import Link from "next/link";
import { usePathname } from "next/navigation";
import _ from "lodash";

export const AccountSidebar = () => {
  const pathname = usePathname();
  const activeModule = moduleForPath(pathname);

  return (
    <aside className="bg-background flex flex-col gap-2 rounded-lg p-3 shadow-lg h-full">
      <div className="mb-2 flex items-center gap-2">
        <div className="bg-sidebar-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm">
          <UserCircle className="text-sidebar-primary-foreground h-5 w-5" />
        </div>
        <span className="text-foreground text-sm font-semibold">
          My Account
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {accountSections.map(({ href, moduleName, icon: Icon, label }) => {
          const isActive = activeModule === moduleName;
          const items = _.get(
            _.find(accountSidebarLinks, { moduleName }),
            "sections[0].items",
            [],
          );

          return (
            <Collapsible
              key={href}
              open={items.length > 1}
              className="flex flex-col gap-1"
            >
              <Link
                href={href}
                className={buttonVariants({
                  variant: "ghost",
                  className: cn(
                    "flex h-9 w-full items-center justify-start gap-2 rounded-lg px-3",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-accent/50",
                  ),
                })}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">{label}</span>
              </Link>

              <CollapsibleContent className="ml-4 flex flex-col gap-0.5 border-l pl-3">
                {items.map((item: AccountSidebarItem) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={buttonVariants({
                      variant: "ghost",
                      className: cn(
                        "flex h-8 justify-start gap-2 rounded-md text-xs font-medium",
                        pathname === item.href
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50",
                      ),
                    })}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>
    </aside>
  );
};
