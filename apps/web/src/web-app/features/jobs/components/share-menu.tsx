"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconBrandX,
  IconLink,
} from "@tabler/icons-react";
import {
  copyJobLink,
  getShareLinks,
} from "@web-app-features/jobs/utils/share-job";
import type { ReactElement } from "react";

export function ShareMenu({
  title,
  url,
  trigger,
}: {
  title: string;
  url: string;
  trigger: ReactElement;
}) {
  const links = getShareLinks(title, url);

  const openShareWindow = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=600");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => openShareWindow(links.whatsapp)}>
          <IconBrandWhatsapp className="text-[#25D366]" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShareWindow(links.linkedin)}>
          <IconBrandLinkedin className="text-[#0A66C2]" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShareWindow(links.twitter)}>
          <IconBrandX />X (Twitter)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            void copyJobLink(url, "Link copied — paste it into Instagram")
          }
        >
          <IconBrandInstagram className="text-[#E1306C]" />
          Instagram
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void copyJobLink(url)}>
          <IconLink />
          Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
