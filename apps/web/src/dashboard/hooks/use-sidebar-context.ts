import { SidebarContext } from './sidebar-context';
import { useContext } from 'react';

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context)
    throw new Error(
      'SidebarContext must be used within a SidebarContextProvider',
    );
  return context;
};
