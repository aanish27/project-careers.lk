import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandX,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

const FOOTER_LINKS: {
  heading: string;
  links: { label: string; href: string }[];
}[] = [
  {
    heading: "For Candidates",
    links: [
      { label: "Browse Jobs", href: "/jobs" },
      { label: "Browse Freelance Gigs", href: "/freelance" },
      { label: "Find Freelancers", href: "/freelance/freelancers" },
      { label: "My Profile", href: "/account" },
    ],
  },
  {
    heading: "For Employers",
    links: [
      { label: "Post a Job", href: "/account/post-job" },
      { label: "Employer Dashboard", href: "/account/company" },
      { label: "Talent Search", href: "/freelance/freelancers" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ],
  },
];

const SOCIAL_LINKS = [
  { icon: IconBrandLinkedin, label: "LinkedIn" },
  { icon: IconBrandX, label: "X" },
  { icon: IconBrandFacebook, label: "Facebook" },
  { icon: IconBrandInstagram, label: "Instagram" },
];

export function Footer() {
  return (
    <footer className="pb-10">
      <div className="grid grid-cols-1 gap-10 border-t border-border pt-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <Link href="/">
            <Image
              src="/jobswala-logo.png"
              alt="Jobswala logo"
              width={100}
              height={100}
              className="h-auto w-15"
            />
          </Link>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Jobs across every industry, updated daily from official employer
            sources.
          </p>
          <div className="mt-5 flex items-center gap-3">
            {SOCIAL_LINKS.map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
        {FOOTER_LINKS.map(({ heading, links }) => (
          <div key={heading}>
            <p className="mb-4 font-semibold text-foreground">{heading}</p>
            <ul className="flex flex-col gap-3">
              {links.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Jobswala. All rights reserved.
        </p>
        <p className="text-sm text-muted-foreground">
          Made for job seekers and employers in Sri Lanka.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
