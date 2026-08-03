import { SEO_GENERATION_QUEUE } from '@careerslk/types';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { SeoGenerationService } from '../seo-generation.service';

@Processor(SEO_GENERATION_QUEUE)
export class SeoGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(SeoGenerationProcessor.name);

  constructor(private readonly seoGenerationService: SeoGenerationService) {
    super();
  }

  async process(): Promise<void> {
    const summary = await this.seoGenerationService.regenerateAll();
    this.logger.log(`Generation processed: ${JSON.stringify(summary)}`);
  }
}
