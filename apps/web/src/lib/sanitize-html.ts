import sanitizeHtml from "sanitize-html";

// Matches exactly what the minimum-tools tiptap editor
// (@/components/tiptap/minimal-rich-text-editor) can produce — bold,
// italic, underline, and lists — so anything else in stored `description`
// HTML (old plain-text data, or a crafted payload) is stripped rather than
// rendered. No links: job descriptions must not carry clickable URLs.
const ALLOWED_TAGS = ["p", "br", "strong", "em", "u", "ul", "ol", "li"];

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {},
  });
}

// For contexts that need a plain-text snippet (card previews, table cells,
// <meta> descriptions) rather than rendered HTML.
export function stripHtmlToText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}
