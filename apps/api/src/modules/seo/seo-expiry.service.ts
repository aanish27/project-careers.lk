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

    const { count } = await this.prisma.job.updateMany({
      where: {
        status: JobStatus.ACTIVE,
        lastSeenAt: { lt: threshold },
      },
      data: { status: JobStatus.EXPIRED },
    });

    this.logger.log(`Flipped ${count} stale job(s) to EXPIRED`);
    return count;
  }
}
