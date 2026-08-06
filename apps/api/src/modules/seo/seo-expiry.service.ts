import { PrismaService } from '@/database/prisma.service';
import { JobStatus } from '@careerslk/types';
import { Injectable, Logger } from '@nestjs/common';

const EXPIRY_THRESHOLD_DAYS = 14;

@Injectable()
export class SeoExpiryService {
  private readonly logger = new Logger(SeoExpiryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async flipExpiredJobs(): Promise<number> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - EXPIRY_THRESHOLD_DAYS);

    const { count: staleCount } = await this.prisma.job.updateMany({
      where: {
        status: JobStatus.ACTIVE,
        lastSeenAt: { lt: threshold },
      },
      data: { status: JobStatus.EXPIRED },
    });

    // Separate from the staleness flip above — a job's own application
    // deadline expires it regardless of source or lastSeenAt freshness.
    const { count: deadlineCount } = await this.prisma.job.updateMany({
      where: {
        status: JobStatus.ACTIVE,
        deadline: { lt: new Date() },
      },
      data: { status: JobStatus.EXPIRED },
    });

    const count = staleCount + deadlineCount;
    this.logger.log(
      `Flipped ${count} job(s) to EXPIRED (${staleCount} stale, ${deadlineCount} past deadline)`,
    );
    return count;
  }
}
