import { SEO_EXPIRY_QUEUE } from '@careerslk/types';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { SeoExpiryService } from '../seo-expiry.service';

@Processor(SEO_EXPIRY_QUEUE)
export class SeoExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(SeoExpiryProcessor.name);

  constructor(private readonly seoExpiryService: SeoExpiryService) {
    super();
  }

  async process(): Promise<void> {
    const count = await this.seoExpiryService.flipExpiredJobs();
    this.logger.log(`Expiry flip processed: ${count} job(s) marked EXPIRED`);
  }
}
