import {
  LayoutDashboard,
  Search,
  Store,
  UserRoundCog,
  Users,
} from 'lucide-react';

export const sections = [
  {
    label: 'Search',
    icon: Search,
    href: 'search',
  },
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: 'dashboard',
  },
  {
    label: 'Users',
    icon: Users,
    href: 'users',
  },
  {
    label: 'Vendors',
    icon: UserRoundCog,
    href: 'vendors',
  },
  {
    label: 'Shops',
    icon: Store,
    href: 'shops',
  },
];
