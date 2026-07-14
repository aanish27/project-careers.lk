'use client';
import SidebarProvider from '@dashboard-hooks/sidebar-provider';
import React from 'react';

const DashboardProviders = ({ children }: { children: React.ReactNode }) => {
  return <SidebarProvider>{children}</SidebarProvider>;
};

export default DashboardProviders;
