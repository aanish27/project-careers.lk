import {
  Accessibility,
  BarChart,
  Bell,
  Box,
  CreditCard,
  FileText,
  FolderOpen,
  Key,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  Truck,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface SidebarLinks {
  moduleName: string;
  sections: SidebarSection[];
}

export const sidebarLinks: SidebarLinks[] = [
  {
    moduleName: 'search',
    sections: [
      {
        title: 'example',
        items: [
          {
            label: 'example',
            icon: LayoutDashboard,
            href: '/example',
          },
        ],
      },
    ],
  },
  {
    moduleName: 'vendors',
    sections: [
      {
        title: 'overview',
        items: [
          {
            label: 'dashboard',
            icon: LayoutDashboard,
            href: '/vendors',
          },
          { label: 'products', icon: Box, href: '/vendors/products' },
        ],
      },
      {
        title: 'manage',
        items: [
          { label: 'Projects', icon: FolderOpen, href: '/vendors/projects' },
          {
            label: 'Notifications',
            icon: Bell,
            href: '/vendors/notifications',
          },
          { label: 'Integrations', icon: Zap, href: '/vendors/integrations' },
        ],
      },
    ],
  },
  {
    moduleName: 'shops',
    sections: [
      {
        title: 'manage',
        items: [
          { label: 'Overview', icon: LayoutDashboard, href: '/shops/overview' },
          { label: 'Products', icon: Package, href: '/shops/products' },
          { label: 'Orders', icon: ShoppingCart, href: '/shops/orders' },
        ],
      },
      {
        title: 'settings',
        items: [
          { label: 'Payments', icon: CreditCard, href: '/shops/payments' },
          { label: 'Shipping', icon: Truck, href: '/shops/shipping' },
          { label: 'Integrations', icon: Zap, href: '/shops/integrations' },
        ],
      },
    ],
  },
  {
    moduleName: 'users',
    sections: [
      {
        title: 'manage',
        items: [
          { label: 'All Users', icon: Users, href: '/users' },
          { label: 'Roles', icon: Shield, href: '/users/roles' },
          { label: 'Permissions', icon: Key, href: '/users/permissions' },
        ],
      },
      {
        title: 'Activity',
        items: [
          { label: 'Logs', icon: Accessibility, href: '/users/logs' },
          { label: 'Notifications', icon: Bell, href: '/users/notifications' },
        ],
      },
    ],
  },
  {
    moduleName: 'dashboard',
    sections: [
      {
        title: 'Overview',
        items: [
          { label: 'Home', icon: LayoutDashboard, href: '/dashboard' },
          { label: 'Analytics', icon: BarChart, href: '/dashboard/analytics' },
          { label: 'Reports', icon: FileText, href: '/dashboard/reports' },
        ],
      },
      {
        title: 'System',
        items: [
          { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
          {
            label: 'Notifications',
            icon: Bell,
            href: '/dashboard/notifications',
          },
        ],
      },
    ],
  },
];
