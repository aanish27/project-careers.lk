import { AccountSidebarContext } from "./sidebar-context";
import { useContext } from "react";

export const useAccountSidebarContext = () => {
  const context = useContext(AccountSidebarContext);
  if (!context)
    throw new Error(
      "AccountSidebarContext must be used within an AccountSidebarProvider",
    );
  return context;
};
