"use client";
import { DashboardQueryProvider } from "@dashboard-components/dashboard-query-provider";
import SidebarProvider from "@dashboard-hooks/sidebar-provider";
import React from "react";

const DashboardProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <DashboardQueryProvider>
      <SidebarProvider>{children}</SidebarProvider>
    </DashboardQueryProvider>
  );
};

export default DashboardProviders;
