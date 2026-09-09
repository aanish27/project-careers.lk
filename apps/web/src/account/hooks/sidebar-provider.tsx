import {
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { AccountSidebarContext } from "./sidebar-context";

export interface IAccountSidebarContextValue {
  isMobileNavOpen: boolean;
  setMobileNavOpen: Dispatch<SetStateAction<boolean>>;
}

const AccountSidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  return (
    <AccountSidebarContext value={{ isMobileNavOpen, setMobileNavOpen }}>
      {children}
    </AccountSidebarContext>
  );
};

export default AccountSidebarProvider;
