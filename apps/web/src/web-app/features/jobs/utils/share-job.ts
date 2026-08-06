export async function shareJob(title: string, url: string): Promise<void> {
  const shareUrl = url.startsWith("http")
    ? url
    : `${window.location.origin}${url}`;

  if (navigator.share) {
    try {
      await navigator.share({ title, url: shareUrl });
    } catch {
      // User cancelled the native share sheet — nothing to do.
    }
    return;
  }

  await navigator.clipboard.writeText(shareUrl);
}
