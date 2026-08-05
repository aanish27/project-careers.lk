import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconBell,
  IconChevronDown,
  IconMessageCircle,
  IconSearch,
} from "@tabler/icons-react";
import Link from "next/link";

interface NavItem {
  label: string;
  href?: string;
}

const NAV_LINKS: { label: string; items: NavItem[] }[] = [
  {
    label: "Find Freelancers",
    items: [
      { label: "Browse Freelancers", href: "/freelance/freelancers" },
      { label: "Post a Gig", href: "/freelance/gigs/new" },
      { label: "Freelancer Marketplace", href: "/freelance/freelancers" },
      { label: "Project Catalog" },
    ],
  },
  {
    label: "Find Work",
    items: [
      { label: "Browse Gigs", href: "/freelance/gigs" },
      { label: "My Profile", href: "/freelance/profile/edit" },
      { label: "My Proposals" },
    ],
  },
  {
    label: "Why Freelance",
    items: [
      { label: "Success Stories" },
      { label: "How It Works" },
      { label: "Community" },
    ],
  },
];

const FreelanceNavbar = () => {
  return (
    <nav className="relative w-full flex flex-row justify-between items-center gap-4 rounded-3xl border border-white/40 dark:border-white/10 bg-white/20 dark:bg-white/5 p-2 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(31,38,135,0.15)] overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl before:bg-linear-to-b before:from-white/50 before:to-transparent before:opacity-40 dark:before:from-white/10">
      <div className="relative flex items-center gap-1 pl-3">
        {NAV_LINKS.map(({ label, items }) => (
          <DropdownMenu key={label}>
            <DropdownMenuTrigger
              openOnHover
              className="group/nav-item flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-foreground/80 outline-none hover:bg-white/40 hover:text-foreground data-popup-open:bg-white/40 data-popup-open:text-foreground dark:hover:bg-white/10 dark:data-popup-open:bg-white/10"
            >
              {label}
              <IconChevronDown className="size-3.5 transition-transform duration-200 group-data-popup-open/nav-item:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {items.map((item) =>
                item.href ? (
                  <DropdownMenuItem
                    key={item.label}
                    render={<Link href={item.href}>{item.label}</Link>}
                  />
                ) : (
                  <DropdownMenuItem key={item.label}>
                    {item.label}
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
        <Button
          variant="ghost"
          className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground/80 hover:bg-white/40 hover:text-foreground dark:hover:bg-white/10"
        >
          Enterprise
        </Button>
      </div>

      <div className="relative flex items-center gap-2 pr-1">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-foreground/70 hover:bg-white/40 hover:text-foreground dark:hover:bg-white/10"
        >
          <IconSearch className="size-4.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-foreground/70 hover:bg-white/40 hover:text-foreground dark:hover:bg-white/10"
          render={<Link href="/freelance/messages" />}
          nativeButton={false}
        >
          <IconMessageCircle className="size-4.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-foreground/70 hover:bg-white/40 hover:text-foreground dark:hover:bg-white/10"
        >
          <IconBell className="size-4.5" />
        </Button>
        <div className="mx-1 h-6 w-px bg-border/60" />
        <Button
          variant="ghost"
          className="rounded-xl px-3 text-sm font-semibold text-foreground/80 hover:bg-white/40 hover:text-foreground dark:hover:bg-white/10"
        >
          Log in
        </Button>
        <Button className="rounded-xl px-5 font-semibold bg-primary/90 backdrop-blur-sm hover:bg-primary">
          Sign up
        </Button>
      </div>
    </nav>
  );
};

export default FreelanceNavbar;
