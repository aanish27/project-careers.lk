import { SEO_LIFECYCLE_QUEUE } from '@careerslk/types';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { SeoLifecycleService } from '../seo-lifecycle.service';

@Processor(SEO_LIFECYCLE_QUEUE)
export class SeoLifecycleProcessor extends WorkerHost {
  private readonly logger = new Logger(SeoLifecycleProcessor.name);

  constructor(private readonly seoLifecycleService: SeoLifecycleService) {
    super();
  }

  async process(): Promise<void> {
    const summary = await this.seoLifecycleService.evaluateAll();
    this.logger.log(
      `Lifecycle evaluation processed: ${JSON.stringify(summary)}`,
    );
  }
}
