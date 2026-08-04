import type {
  AbuseReportCategory,
  AbuseReportEntityType,
  AbuseReportStatus,
} from '../enums';

export * from './schemas';

export interface AbuseReport {
  id: number;
  reporterWebUserId: number;
  entityType: AbuseReportEntityType;
  entityId: number;
  category: AbuseReportCategory;
  details: string | null;
  contentSnapshot: string;
  status: AbuseReportStatus;
  reviewedByAdminId: number | null;
  reviewedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
}

export interface AbuseReportWithReporter extends AbuseReport {
  reporter: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}
