import { z } from 'zod';

export const seoPageFaqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const updateSeoPageSchema = z.object({
  title: z.string().min(1).optional(),
  metaDescription: z.string().min(1).optional(),
  h1: z.string().min(1).optional(),
  introText: z.string().optional(),
  bottomText: z.string().optional(),
  faqJson: z.array(seoPageFaqItemSchema).optional(),
  isIndexable: z.boolean().optional(),
  relatedLinksJson: z.array(z.string()).optional(),
});

export type UpdateSeoPageInput = z.infer<typeof updateSeoPageSchema>;
