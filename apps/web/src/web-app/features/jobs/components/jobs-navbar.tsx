"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useRequireAuth } from "@/web-app/hooks/use-require-auth";
import { useWebUser } from "@/web-app/providers/web-user-provider";
import { IconSearch } from "@tabler/icons-react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Browse", href: "/jobs" },
  { label: "Remote Jobs", href: "/jobs/remote-jobs" },
  { label: "Internships", href: "/jobs/internship" },
  { label: "Talent Pools", href: "/jobs/talent-pools" },
];

const JobsNavbar = () => {
  const requireAuth = useRequireAuth();
  const { isLoggedIn } = useWebUser();

  return (
    <nav className="relative w-full flex flex-row justify-between items-center rounded-3xl border border-white/40 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(31,38,135,0.15)] overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl before:bg-linear-to-b before:from-white/50 before:to-transparent before:opacity-40 dark:before:from-white/10">
      <div className="relative flex gap-1 rounded-2xl border border-white/30 dark:border-white/10 bg-white/10 dark:bg-black/20 backdrop-blur-md shadow-inner">
        <InputGroup className="rounded-2xl border border-background bg-background p-1 px-5 font-semibold text-primary shadow-sm backdrop-blur-sm hover:bg-background/10">
          <InputGroupInput placeholder="Search" />
          <InputGroupAddon>
            <IconSearch />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div className="flex items-center gap-5">
        {NAV_LINKS.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className="group/nav-item relative text-sm font-medium text-foreground/80 outline-none hover:text-foreground"
          >
            {label}
            <span className="absolute inset-x-0 -bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-primary transition-transform duration-200 group-hover/nav-item:scale-x-100" />
          </Link>
        ))}
        <div className="relative flex gap-5 p-1">
          {isLoggedIn ? (
            <Link
              href="/account/post-job"
              className={buttonVariants({
                className:
                  " font-semibold backdrop-blur-sm bg-primary/90 hover:bg-primary rounded-2xl p-1 px-5",
              })}
            >
              Post a Job
            </Link>
          ) : (
            <Button
              className=" font-semibold backdrop-blur-sm bg-primary/90 hover:bg-primary rounded-2xl p-1 px-5"
              onClick={() => requireAuth(() => {})}
            >
              Post a Job
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default JobsNavbar;
