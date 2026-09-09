"use client";
import AccountSidebarProvider from "@account-hooks/sidebar-provider";
import React from "react";

export function AccountProviders({ children }: { children: React.ReactNode }) {
  return <AccountSidebarProvider>{children}</AccountSidebarProvider>;
}
