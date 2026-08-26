import { IBreadcrumbItem } from "@web-app-features/ui/types";
import Link from "next/link";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const JobsBreadcrumb = ({
  breadcrumbs,
}: {
  breadcrumbs?: IBreadcrumbItem[];
}) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbLink
          render={
            <Link href={"/jobs"} className="hover:underline">
              /
            </Link>
          }
        />
        {breadcrumbs && <BreadcrumbSeparator />}
        {breadcrumbs?.map((crumb, index) => (
          <Fragment key={crumb.url}>
            <BreadcrumbItem>
              <BreadcrumbLink
                render={
                  <Link href={crumb.url} className="hover:underline">
                    {crumb.name}
                  </Link>
                }
              />
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
