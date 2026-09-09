import { toast } from "sonner";

export function resolveShareUrl(url: string): string {
  if (url.startsWith("http")) return url;
  if (typeof window === "undefined") return url;
  return `${window.location.origin}${url}`;
}

export function getShareLinks(title: string, url: string) {
  const shareUrl = resolveShareUrl(url);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  return {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
  };
}

export async function copyJobLink(
  url: string,
  message = "Link copied to clipboard",
): Promise<void> {
  await navigator.clipboard.writeText(resolveShareUrl(url));
  toast(message);
}
