"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { SeoPageFaqItem } from "@web-app-features/seo/types";

export function FaqAccordion({ items }: { items: SeoPageFaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <Accordion
      defaultValue={[items[0].question]}
      className="rounded-2xl border border-border bg-card px-5"
    >
      {items.map((item) => (
        <AccordionItem key={item.question} value={item.question}>
          <AccordionTrigger className="text-base font-semibold">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default FaqAccordion;
