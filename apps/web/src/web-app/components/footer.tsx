import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandX,
} from "@tabler/icons-react";
import Image from "next/image";

const FOOTER_LINKS = [
  {
    heading: "For Candidates",
    links: ["Browse Jobs", "Browse Categories", "Career Advice", "Saved Jobs"],
  },
  {
    heading: "For Employers",
    links: ["Post a Job", "Pricing", "Employer Dashboard", "Talent Search"],
  },
  {
    heading: "Company",
    links: ["About Us", "Careers", "Blog", "Contact"],
  },
  {
    heading: "Legal",
    links: ["Terms of Service", "Privacy Policy", "Cookie Policy"],
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
    <footer className="mt-24 border-t border-border pb-10 pt-12">
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <Image
            src="/jobswala-logo.png"
            alt="logo"
            width={100}
            height={100}
            className="h-auto w-15"
          />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Aggregated tech jobs from high-growth sources, curated for
            precision.
          </p>
        </div>
        {FOOTER_LINKS.map(({ heading, links }) => (
          <div key={heading}>
            <p className="mb-4 font-semibold text-foreground">{heading}</p>
            <ul className="flex flex-col gap-3">
              {links.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link}
                  </a>
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
        <div className="flex items-center gap-4">
          {SOCIAL_LINKS.map(({ icon: Icon, label }) => (
            <a
              key={label}
              href="#"
              aria-label={label}
              className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Icon className="size-4" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
