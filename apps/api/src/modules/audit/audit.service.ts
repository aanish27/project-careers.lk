import { Prisma } from '@careerslk/database';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditAction } from './audit.constant';

export interface AuditContext {
  actorUserId: number | null;
  actorEmail: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditEntry {
  action: AuditAction;
  entityType: string;
  entityId: string | number;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(
    context: AuditContext,
    entry: AuditEntry,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;

    try {
      await client.auditLog.create({
        data: {
          actorUserId: context.actorUserId,
          actorEmail: context.actorEmail,
          action: entry.action,
          entityType: entry.entityType,
          entityId: String(entry.entityId),
          oldValue: (entry.oldValue as Prisma.InputJsonValue) ?? undefined,
          newValue: (entry.newValue as Prisma.InputJsonValue) ?? undefined,
          ipAddress: context.ipAddress ?? null,
          userAgent: context.userAgent ?? null,
        },
      });
    } catch (error) {
      if (tx) {
        throw error;
      }

      this.logger.error(
        `Failed to write audit log for ${entry.action} on ${entry.entityType}:${String(entry.entityId)}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
