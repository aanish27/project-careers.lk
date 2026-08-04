/** @deprecated superseded by the dynamic Role/Permission system in ./permissions.ts; retained only for the legacy RolesGuard on StorageController */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  FREELANCE = 'freelance',
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

// Plain const+type (not a nominal `enum`) so Prisma-returned SeoPage.pageType
// values — themselves a plain string-literal union in the generated client —
// are directly assignable here without a cast, in either direction.
export const SeoPageType = {
  SECTOR: 'SECTOR',
  ROLE: 'ROLE',
  LOCATION: 'LOCATION',
  ROLE_LOCATION: 'ROLE_LOCATION',
  COMPANY: 'COMPANY',
  SKILL: 'SKILL',
  REMOTE: 'REMOTE',
  INTERNSHIP: 'INTERNSHIP',
  ALL_JOBS: 'ALL_JOBS',
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
  USER_SUBMITTED: 'USER_SUBMITTED',
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
