import type { FreelanceApprovalStatus } from '../enums';
import type { WorkHistoryEntry } from './schemas';

export * from './schemas';

export interface FreelanceProfile {
  id: number;
  webUserId: number;
  bio: string | null;
  rate: number | null;
  rateCurrency: string | null;
  category: string | null;
  skills: string[];
  portfolioLinks: string[];
  workHistory: WorkHistoryEntry[] | null;
  cvFileKey: string | null;
  portfolioFileKeys: string[];
  approvalStatus: FreelanceApprovalStatus;
  approvedByAdminId: number | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  slug: string;
}

// Admin-only surface — the one place `internalReviewNotes` is allowed to
// appear. Never returned from a public or web-user self-service endpoint.
export interface FreelanceProfileWithInternalNotes extends FreelanceProfile {
  internalReviewNotes: string | null;
}

// File keys resolved to freshly-signed, non-expiring-on-read URLs at
// response time (see storage.service.getUrl) — never a persisted URL.
export interface FreelanceProfileWithFileUrls extends FreelanceProfile {
  cvUrl: string | null;
  portfolioUrls: string[];
}

export interface Gig {
  id: number;
  postedByWebUserId: number;
  title: string;
  description: string | null;
  category: string | null;
  skills: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  budgetCurrency: string | null;
  deadline: string | null;
  attachmentFileKeys: string[];
  approvalStatus: FreelanceApprovalStatus;
  approvedByAdminId: number | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  slug: string;
}

export interface GigWithInternalNotes extends Gig {
  internalReviewNotes: string | null;
}

export interface GigWithFileUrls extends Gig {
  attachmentUrls: string[];
}
