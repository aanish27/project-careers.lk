export function StructuredData({ data }: { data: unknown }) {
  if (!data) return null;

  // Escaping `<` prevents a string field (e.g. a scraped job description)
  // containing "</script>" from breaking out of this JSON-LD tag.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export default StructuredData;
