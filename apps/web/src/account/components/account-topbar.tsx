"use client";
import { Avatar, AvatarFallback } from "@ui/avatar";

import { useAccountSidebarContext } from "@account-hooks/use-sidebar-context";
import { useWebUser } from "@jobboard/providers/web-user-provider";
import { Badge } from "@ui/badge";
import { Button, buttonVariants } from "@ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ui/dropdown-menu";
import { logout } from "@web-app-features/auth/api/web-user-auth.actions";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMyNotifications,
} from "@web-app-features/notifications/hooks/use-my-notifications";
import { Bell, LogOut, Menu, Plus } from "lucide-react";
import Link from "next/link";

function relativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AccountTopbar() {
  const { setMobileNavOpen } = useAccountSidebarContext();
  const { user } = useWebUser();
  const { data } = useMyNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  if (!user) return null;

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.items ?? [];

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
                className="bg-background relative rounded-full shadow-lg"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center p-0 text-xs"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>
            }
          ></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-foreground text-xs font-semibold">
                Notifications
              </p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="text-muted-foreground text-xs underline"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                >
                  Mark all read
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length ? (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start gap-0.5 whitespace-normal"
                  onClick={() => {
                    if (!notification.readAt) markRead.mutate(notification.id);
                  }}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-xs font-medium">
                      {notification.title}
                    </span>
                    {!notification.readAt && (
                      <span className="bg-destructive h-1.5 w-1.5 shrink-0 rounded-full" />
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {notification.message}
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    {relativeTime(notification.createdAt)}
                  </span>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="text-muted-foreground px-2 py-4 text-center text-xs">
                No notifications yet
              </div>
            )}
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
