import {
  SEO_EXPIRY_QUEUE,
  SEO_GENERATION_QUEUE,
  SEO_LIFECYCLE_QUEUE,
} from '@careerslk/types';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { SeoExpiryProcessor } from './processors/seo-expiry.processor';
import { SeoGenerationProcessor } from './processors/seo-generation.processor';
import { SeoLifecycleProcessor } from './processors/seo-lifecycle.processor';
import { SeoExpiryService } from './seo-expiry.service';
import { SeoGenerationService } from './seo-generation.service';
import { SeoInputService } from './seo-input.service';
import { SeoLifecycleService } from './seo-lifecycle.service';
import { SeoLinksService } from './seo-links.service';
import { SeoPagesController } from './seo-pages.controller';
import { SeoPagesService } from './seo-pages.service';
import { SeoValidationService } from './seo-validation.service';
import { SeoScheduler } from './seo.scheduler';

/**
 * Public-facing SEO module: read-only page content for Next.js to render,
 * plus the whole pSEO engine (generation/lifecycle/expiry services and
 * their schedulers). Flat-imported only — not nested under the admin
 * RouterModule prefix (decision #5). SeoAdminModule imports this module to
 * reuse its services for the admin CRUD/override controller.
 */
@Module({
  imports: [
    BullModule.registerQueue(
      { name: SEO_EXPIRY_QUEUE },
      { name: SEO_GENERATION_QUEUE },
      { name: SEO_LIFECYCLE_QUEUE },
    ),
  ],
  controllers: [SeoPagesController],
  providers: [
    SeoExpiryService,
    SeoInputService,
    SeoLinksService,
    SeoValidationService,
    SeoGenerationService,
    SeoLifecycleService,
    SeoPagesService,
    SeoScheduler,
    SeoExpiryProcessor,
    SeoGenerationProcessor,
    SeoLifecycleProcessor,
  ],
  exports: [SeoGenerationService, SeoLifecycleService, SeoPagesService],
})
export class SeoModule {}
