import { PrismaService } from '@/database/prisma.service';
import { Injectable } from '@nestjs/common';

export interface SeoValidationResult {
  valid: boolean;
  issues: string[];
}

export interface SeoValidationParams {
  pageId?: number;
  title: string;
  metaDescription: string;
  introText: string;
  bottomText: string;
  canonicalUrl: string;
  jobCount: number;
  threshold: number;
}

const UNRESOLVED_PLACEHOLDER = /\{[a-zA-Z]+\}/;
const STUFFING_RATIO_THRESHOLD = 0.08;
const MIN_WORDS_FOR_STUFFING_CHECK = 20;

/** SRS 12.14 quality control — checked before a page may be marked indexable. */
@Injectable()
export class SeoValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(params: SeoValidationParams): Promise<SeoValidationResult> {
    const issues: string[] = [];

    if (params.jobCount < params.threshold) {
      issues.push(
        `Job count ${params.jobCount} is below the minimum threshold of ${params.threshold}`,
      );
    }

    const excludeSelf = params.pageId ? { not: params.pageId } : undefined;
    const [duplicateTitle, duplicateMeta] = await Promise.all([
      this.prisma.seoPage.findFirst({
        where: { title: params.title, id: excludeSelf },
        select: { id: true },
      }),
      this.prisma.seoPage.findFirst({
        where: { metaDescription: params.metaDescription, id: excludeSelf },
        select: { id: true },
      }),
    ]);
    if (duplicateTitle) issues.push('Title is not unique across SEO pages');
    if (duplicateMeta) {
      issues.push('Meta description is not unique across SEO pages');
    }

    if (!params.canonicalUrl) issues.push('Canonical URL is missing');

    if (
      UNRESOLVED_PLACEHOLDER.test(params.introText) ||
      UNRESOLVED_PLACEHOLDER.test(params.bottomText)
    ) {
      issues.push(
        'Generated content contains an unresolved template placeholder',
      );
    }

    const stuffingIssue = this.checkKeywordStuffing(params.bottomText);
    if (stuffingIssue) issues.push(stuffingIssue);

    return { valid: issues.length === 0, issues };
  }

  private checkKeywordStuffing(text: string): string | null {
    const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    if (words.length < MIN_WORDS_FOR_STUFFING_CHECK) return null;

    const frequency = new Map<string, number>();
    for (const word of words) {
      frequency.set(word, (frequency.get(word) ?? 0) + 1);
    }

    for (const [word, count] of frequency) {
      if (word.length < 4) continue; // skip short stopword-like tokens
      if (count / words.length > STUFFING_RATIO_THRESHOLD) {
        return `Word "${word}" appears too frequently (possible keyword stuffing)`;
      }
    }

    return null;
  }
}
