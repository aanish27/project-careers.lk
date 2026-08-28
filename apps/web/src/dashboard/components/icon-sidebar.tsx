import { Tooltip, TooltipContent, TooltipTrigger } from "@ui/tooltip";
import { cn } from "@utils/utils";
import { FileText, Settings } from "lucide-react";
import { sections } from "@dashboard-config/icon-sidebar-links";
import { Button, buttonVariants } from "@ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ui/dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@dashboard-hooks/use-auth";

export const IconSidebar = () => {
  const location = usePathname();
  const { can } = useAuth();
  // hrefs are "admin/<section>" (e.g. "admin/company"), so compare against the
  // first two path segments joined back together, not just the first segment.
  const activeSection = location.split("/").slice(1, 3).join("/");
  const visibleSections = sections.filter(
    (section) => !section.permission || can(section.permission),
  );

  return (
    <div className="bg-background flex flex-col items-center gap-3 rounded-lg py-3 shadow-lg">
      <div className="bg-sidebar-primary mb-2 flex h-9 w-9 items-center justify-center rounded-lg shadow-sm transition-shadow hover:shadow-md">
        <Settings className="text-sidebar-primary-foreground h-5 w-5" />
      </div>

      <nav className="mt-2 flex flex-col gap-3">
        {visibleSections.map(({ href, icon: Icon, label }) => (
          <Tooltip key={href}>
            <TooltipTrigger
              render={
                <Link
                  href={`/${href}`}
                  className={buttonVariants({
                    variant: "ghost",
                    className: cn(
                      "group relative flex h-9 w-9 items-center justify-center rounded-lg shadow-lg transition-all",
                      activeSection === href
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                        : "text-foreground hover:bg-accent",
                    ),
                  })}
                >
                  <Icon className="h-5 w-5" />
                  {/* {notifications && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center p-0 text-xs"
                    >
                      {notifications}
                    </Badge>
                  )} */}
                </Link>
              }
            ></TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ))}
      </nav>

      <div className="flex-1" />
      <div className="mt-2 flex flex-col gap-1">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger
              render={
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <Settings className="text-foreground h-4 w-4" />
                    </Button>
                  }
                ></DropdownMenuTrigger>
              }
            ></TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="right" align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs">
                Settings
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-xs">
                <Settings className="mr-2 h-3 w-3" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs">
                <FileText className="mr-2 h-3 w-3" />
                Help & Support
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
