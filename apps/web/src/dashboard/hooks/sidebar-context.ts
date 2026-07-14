import { ISidebarContextValue } from './sidebar-provider';
import { createContext } from 'react';

export const SidebarContext = createContext<ISidebarContextValue | null>(null);
