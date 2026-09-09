"use client";
import { Avatar, AvatarFallback } from "@ui/avatar";

import { useAccountSidebarContext } from "@account-hooks/use-sidebar-context";
import { useWebUser } from "@jobboard/providers/web-user-provider";
import { Button, buttonVariants } from "@ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ui/dropdown-menu";
import { logout } from "@web-app-features/auth/api/web-user-auth.actions";
import { Bell, LogOut, Menu, Plus } from "lucide-react";
import Link from "next/link";

export function AccountTopbar() {
  const { setMobileNavOpen } = useAccountSidebarContext();
  const { user } = useWebUser();

  if (!user) return null;

  const initials =
    `${user.firstName?.[0] ?? user.email[0]}${user.lastName?.[0] ?? ""}`.toUpperCase();
  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : user.email;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-3">
        <Button
          size="icon"
          onClick={() => setMobileNavOpen(true)}
          variant="outline"
          className="shadow-md md:hidden"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/account/post-job"
          className={buttonVariants({
            className: "rounded-full shadow-lg",
          })}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Post a job</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="bg-background rounded-full shadow-lg"
              >
                <Bell className="h-4 w-4" />
              </Button>
            }
          ></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="text-muted-foreground px-2 py-3 text-center text-xs">
              No new notifications
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="bg-background rounded-full p-2 shadow-lg"
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="text-foreground hidden max-w-32 truncate text-xs font-medium sm:inline-block">
                  {displayName}
                </span>
              </Button>
            }
          ></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-foreground text-xs font-semibold">
                {displayName}
              </p>
              <p className="text-muted-foreground text-xs">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-xs text-red-600"
              onClick={() => {
                void logout();
              }}
            >
              <LogOut className="mr-2 h-3 w-3" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
