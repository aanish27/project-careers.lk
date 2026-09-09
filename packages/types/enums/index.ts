export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
}

export enum ScrapeStatus {
  ACTIVE = 'active',
  EMPTY = 'empty',
  SUSPECTED_FAILURE = 'suspected_failure',
  ERROR = 'error',
}

export enum SkillType {
  EXPLICIT = 'explicit',
  INFERRED = 'inferred',
}

export enum JobStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
}

export enum InvoiceStatus {
  PENDING = 'pending',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export enum PackageType {
  ADSENSE = 'adsense',
  MODAL = 'modal',
  SPONSORED_CARD = 'sponsored_card',
}

// Plain const+type (not a nominal `enum`) for two reasons: (1) so
// Prisma-returned SeoPage.pageType values — a plain `string` column, not a
// DB enum (see schema.prisma) — are directly assignable here without a cast,
// in either direction; (2) so the set of page types is purely an
// application-level concern — adding one is a change here + the generation
// service, never a schema migration.
export const SeoPageType = {
  SECTOR: 'SECTOR',
  ROLE: 'ROLE',
  LOCATION: 'LOCATION',
  ROLE_LOCATION: 'ROLE_LOCATION',
  COMPANY: 'COMPANY',
  SKILL: 'SKILL',
  REMOTE: 'REMOTE',
  INTERNSHIP: 'INTERNSHIP',
  TALENT_POOL: 'TALENT_POOL',
  ALL_JOBS: 'ALL_JOBS',
  HOME: 'HOME',
} as const;

export type SeoPageType = (typeof SeoPageType)[keyof typeof SeoPageType];

export enum ScrapeTriggeredBy {
  SCHEDULED = 'scheduled',
  MANUAL = 'manual',
}

export const ScrapeType = {
  COMPANY: 'company',
  JOBS: 'jobs',
} as const;

export type ScrapeType = (typeof ScrapeType)[keyof typeof ScrapeType];

export const PaginationType = {
  INFINITE_SCROLLING: 'infinite_scrolling',
  LOAD_MORE_BUTTON: 'load_more_button',
  NEXT_BUTTON: 'next_button',
  PAGINATION_NUMBERS: 'pagination_numbers',
} as const;

export type PaginationType =
  (typeof PaginationType)[keyof typeof PaginationType];

export const CompanyStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type CompanyStatus = (typeof CompanyStatus)[keyof typeof CompanyStatus];

// Plain const+type (see SeoPageType above) so Prisma-returned Job/Company/
// CompanyClaim values are directly assignable without a cast.
export const JobSource = {
  SCRAPED: 'SCRAPED',
  POSTED: 'POSTED',
} as const;

export type JobSource = (typeof JobSource)[keyof typeof JobSource];

export const JobApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type JobApprovalStatus =
  (typeof JobApprovalStatus)[keyof typeof JobApprovalStatus];

export const CompanyAutoApprovalStatus = {
  NONE: 'NONE',
  REQUESTED: 'REQUESTED',
  GRANTED: 'GRANTED',
  DENIED: 'DENIED',
} as const;

export type CompanyAutoApprovalStatus =
  (typeof CompanyAutoApprovalStatus)[keyof typeof CompanyAutoApprovalStatus];

export const ClaimStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type ClaimStatus = (typeof ClaimStatus)[keyof typeof ClaimStatus];

export const LocationLevel = {
  PROVINCE: 'PROVINCE',
  DISTRICT: 'DISTRICT',
  CITY: 'CITY',
} as const;

export type LocationLevel = (typeof LocationLevel)[keyof typeof LocationLevel];

export const FreelanceApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type FreelanceApprovalStatus =
  (typeof FreelanceApprovalStatus)[keyof typeof FreelanceApprovalStatus];

export const AbuseReportEntityType = {
  FREELANCE_PROFILE: 'FREELANCE_PROFILE',
  GIG: 'GIG',
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  CHAT_THREAD: 'CHAT_THREAD',
} as const;

export type AbuseReportEntityType =
  (typeof AbuseReportEntityType)[keyof typeof AbuseReportEntityType];

export const AbuseReportCategory = {
  SPAM: 'SPAM',
  SCAM_FRAUD: 'SCAM_FRAUD',
  HARASSMENT: 'HARASSMENT',
  INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
  OTHER: 'OTHER',
} as const;

export type AbuseReportCategory =
  (typeof AbuseReportCategory)[keyof typeof AbuseReportCategory];

export const AbuseReportStatus = {
  PENDING: 'PENDING',
  REVIEWED: 'REVIEWED',
  DISMISSED: 'DISMISSED',
} as const;

export type AbuseReportStatus =
  (typeof AbuseReportStatus)[keyof typeof AbuseReportStatus];

export const EmploymentType = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACT',
} as const;

export type EmploymentType =
  (typeof EmploymentType)[keyof typeof EmploymentType];

export const WorkMode = {
  HYBRID: 'HYBRID',
  ONSITE: 'ONSITE',
  REMOTE: 'REMOTE',
} as const;

export type WorkMode = (typeof WorkMode)[keyof typeof WorkMode];

export const AppType = {
  JOBS: 'JOBS',
  FREELANCE: 'FREELANCE',
  TALENTS: 'TALENTS',
} as const;

export type AppType = (typeof AppType)[keyof typeof AppType];
