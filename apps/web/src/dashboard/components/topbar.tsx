'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@ui/avatar';
import { Badge } from '@ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@ui/breadcrumb';

import { useSidebarContext } from '@dashboard-hooks/use-sidebar-context';
import {
  Bell,
  ChevronLeft,
  CircleQuestionMark,
  DotIcon,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react';
import { Button } from '@ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/dropdown-menu';

export function Topbar() {
  const { isSidebarOpen, setSidebarOpen } = useSidebarContext();

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-3">
        <Button
          size="icon"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          variant="outline"
          className="shadow-md"
        >
          <ChevronLeft
            className={`h-4 w-4 transition-transform ${isSidebarOpen ? '' : 'rotate-180'}`}
          />
        </Button>

        <Breadcrumb className="bg-background rounded-lg p-2 shadow-md">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <DotIcon />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="/components">Components</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <DotIcon />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-background rounded-full px-2 shadow-lg">
          <Button variant="ghost" size="icon" className="relative">
            <Bell />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center p-0 text-xs"
            >
              2
            </Badge>
          </Button>
          <Button variant="ghost" size="icon">
            <CircleQuestionMark />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              className="bg-background rounded-full p-2 shadow-lg"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
                <AvatarFallback>AJ</AvatarFallback>
              </Avatar>
              <span className="text-foreground hidden max-w-20 truncate text-xs font-medium sm:inline-block">
                {/* {user?.username} */} axnish27
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-foreground text-xs font-semibold">
                {/* {user?.name} */}Aanish
              </p>
              <p className="text-muted-foreground text-xs">
                {/* {user?.email} */} aanish2710@gmail.com
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-xs">
              <SettingsIcon className="mr-2 h-3 w-3" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-xs">
              <SettingsIcon className="mr-2 h-3 w-3" />
              Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-xs text-red-600">
              <LogOut className="mr-2 h-3 w-3" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
