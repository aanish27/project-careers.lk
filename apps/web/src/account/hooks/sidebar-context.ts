import { IAccountSidebarContextValue } from "./sidebar-provider";
import { createContext } from "react";

export const AccountSidebarContext =
  createContext<IAccountSidebarContextValue | null>(null);
