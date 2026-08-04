"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useBlockedUsers } from "../hooks/use-blocked-users";
import { useUnblockUser } from "../hooks/use-unblock-user";

export function BlockedUsersList() {
  const { data: blockedUsers, isLoading } = useBlockedUsers();
  const unblockUser = useUnblockUser();

  if (isLoading || !blockedUsers || blockedUsers.length === 0) return null;

  return (
    <div className="mt-8 flex flex-col gap-3">
      <h2 className="text-lg font-bold text-foreground">Blocked users</h2>
      <ul className="flex flex-col gap-2">
        {blockedUsers.map((blocked) => {
          const name =
            [blocked.firstName, blocked.lastName].filter(Boolean).join(" ") ||
            "User";
          return (
            <li
              key={blocked.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-white p-3"
            >
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  {blocked.avatarUrl && (
                    <AvatarImage src={blocked.avatarUrl} alt={name} />
                  )}
                  <AvatarFallback>
                    {name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">
                  {name}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={unblockUser.isPending}
                onClick={() => unblockUser.mutate(blocked.id)}
              >
                {unblockUser.isPending ? "Unblocking…" : "Unblock"}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
