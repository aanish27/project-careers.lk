"use client";

import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@jobboard/hooks/use-require-auth";
import { useWebUser } from "@jobboard/providers/web-user-provider";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Jobs", href: "/" },
  { label: "Freelance", href: "/freelance" },
  { label: "Talents", href: "/freelance/freelancers" },
];

export const PrimaryNavbar = () => {
  const { isLoggedIn, openLoginModal } = useWebUser();
  const requireAuth = useRequireAuth();
  const pathname = usePathname();

  return (
    <nav className="relative w-full p-2 flex flex-row justify-between items-center rounded-3xl border border-white/40 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(31,38,135,0.15)] overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl before:bg-linear-to-b before:from-white/50 before:to-transparent before:opacity-40 dark:before:from-white/10">
      <Image
        src={"/jobswala-logo.png"}
        alt="logo"
        width={100}
        height={100}
        loading="eager"
        className="h-auto w-15"
      />
      <div className="relative flex p-1.5 gap-1 rounded-2xl border border-white/30 dark:border-white/10 bg-white/10 dark:bg-black/20 backdrop-blur-md shadow-inner">
        {NAV_ITEMS.map(({ label, href }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "rounded-xl p-1 px-5 font-semibold",
                isActive
                  ? "text-primary bg-white/80 dark:bg-white/15 backdrop-blur-sm shadow-sm"
                  : "text-foreground/70 dark:text-white/70",
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <Button
            variant="outline"
            className="p-5 font-semibold backdrop-blur-sm"
            render={<Link href="/post-job">Post a Job</Link>}
            nativeButton={false}
          />
        ) : (
          <Button
            variant="outline"
            className="p-5 font-semibold backdrop-blur-sm"
            onClick={() => requireAuth(() => {})}
          >
            Post a Job
          </Button>
        )}
        {isLoggedIn ? (
          <Button
            className="p-5 font-semibold backdrop-blur-sm bg-primary/90 hover:bg-primary"
            render={<Link href="/profile">Profile</Link>}
            nativeButton={false}
          />
        ) : (
          <Button
            className="p-5 font-semibold backdrop-blur-sm bg-primary/90 hover:bg-primary"
            onClick={() => openLoginModal()}
          >
            Sign in
          </Button>
        )}
      </div>
    </nav>
  );
};
