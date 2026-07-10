export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
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

export enum SeoPageType {
  ROLE = 'role',
  LOCATION = 'location',
  ROLE_LOCATION = 'role_location',
  COMPANY = 'company',
  SKILL = 'skill',
  REMOTE = 'remote',
  INTERNSHIP = 'internship',
}

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
