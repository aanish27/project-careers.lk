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
  ACTIVE = 'active',
  EXPIRED = 'expired',
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
