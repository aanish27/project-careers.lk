"use client";
import { useSidebarContext } from "@dashboard-hooks/use-sidebar-context";
import _ from "lodash";
import { usePathname } from "next/navigation";
import { Activity } from "react";
import { sidebarLinks } from "@dashboard-config/sidebar-links";
import { IconSidebar } from "./icon-sidebar";
import { SidebarMenu } from "./sidebar-menu";

export const DashboardSidebar = () => {
  const { isSidebarOpen } = useSidebarContext();
  const location = usePathname();
  // Real routes are nested under /admin/<module>/..., so the module name is
  // the segment after "admin", not the first segment.
  const section = location.split("/")[2] ?? location.split("/")[1];
  const sections = _.get(
    _.find(sidebarLinks, { moduleName: section }),
    "sections",
    [],
  );

  return (
    <>
      <IconSidebar />
      <Activity mode={isSidebarOpen ? "visible" : "hidden"}>
        <SidebarMenu
          sectionTitle={section}
          sections={sections}
          activeItem={location.split("/")[2] ?? "dashboard"}
        />
      </Activity>
    </>
  );
};
