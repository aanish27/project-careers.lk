import {
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { SidebarContext } from "./sidebar-context";

export interface ISidebarContextValue {
  isSidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
}

const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  return (
    <SidebarContext value={{ isSidebarOpen, setSidebarOpen }}>
      {children}
    </SidebarContext>
  );
};

export default SidebarProvider;
