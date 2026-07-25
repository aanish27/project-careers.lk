"use client";

import { createContext, type ReactNode } from "react";
import type { AuthUser } from "@lib/api-client";

export const AuthContext = createContext<AuthUser | null>(null);

export function AuthProvider({
  user,
  children,
}: {
  user: AuthUser;
  children: ReactNode;
}) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}
