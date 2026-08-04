"use client";

import { useWebUser } from "@jobboard/providers/web-user-provider";
import { usePathname } from "next/navigation";
import { useCallback } from "react";

// One hook every gated in-page action (save job, post job, edit company)
// routes through: if logged in, runs `fn`; if not, opens the login modal
// instead of navigating away or failing silently (FR-2).
export function useRequireAuth() {
  const { isLoggedIn, openLoginModal } = useWebUser();
  const pathname = usePathname();

  return useCallback(
    (fn: () => void) => {
      if (isLoggedIn) {
        fn();
        return;
      }
      openLoginModal(pathname);
    },
    [isLoggedIn, openLoginModal, pathname],
  );
}
