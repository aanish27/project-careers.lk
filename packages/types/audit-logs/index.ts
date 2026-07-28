import type { AdminUser } from '../rbac-entities';

export interface AuditLog {
  id: number;
  actorUserId: number | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: unknown;
  newValue: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogWithActor extends AuditLog {
  actor: Pick<AdminUser, 'id' | 'email' | 'firstName' | 'lastName'> | null;
}
