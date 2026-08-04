"use client";

import type { WebUser } from "@web-app-lib/web-user-client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface WebUserContextValue {
  user: WebUser | null;
  isLoggedIn: boolean;
  isLoginModalOpen: boolean;
  loginModalNext: string | undefined;
  openLoginModal: (next?: string) => void;
  closeLoginModal: () => void;
}

const WebUserContext = createContext<WebUserContextValue | null>(null);

export function WebUserProvider({
  initialUser,
  children,
}: {
  initialUser: WebUser | null;
  children: React.ReactNode;
}) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalNext, setLoginModalNext] = useState<string | undefined>(
    undefined,
  );

  const openLoginModal = useCallback((next?: string) => {
    setLoginModalNext(next);
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      user: initialUser,
      isLoggedIn: initialUser !== null,
      isLoginModalOpen,
      loginModalNext,
      openLoginModal,
      closeLoginModal,
    }),
    [
      initialUser,
      isLoginModalOpen,
      loginModalNext,
      openLoginModal,
      closeLoginModal,
    ],
  );

  return (
    <WebUserContext.Provider value={value}>{children}</WebUserContext.Provider>
  );
}

export function useWebUser(): WebUserContextValue {
  const ctx = useContext(WebUserContext);
  if (!ctx) {
    throw new Error("useWebUser must be used within a WebUserProvider");
  }
  return ctx;
}
