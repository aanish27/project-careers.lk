import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebRevalidationService {
  private readonly logger = new Logger(WebRevalidationService.name);

  constructor(private readonly config: ConfigService) {}

  // Fail open — mirrors apps/web/src/proxy.ts's retirement-check convention:
  // a revalidation-webhook hiccup must never block or fail the job
  // create/edit/approve/etc. request that triggered it. Worst case, the
  // pSEO page shows the change up to 24h later via its own `revalidate`
  // window instead of instantly.
  async revalidateTags(tags: string[]): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    const internalKey = this.config.get<string>('internal.apiKey');

    if (!frontendUrl || !internalKey) {
      this.logger.warn(
        'Skipping web revalidation — FRONTEND_URL or internal.apiKey not configured',
      );
      return;
    }

    try {
      const response = await fetch(`${frontendUrl}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': internalKey,
        },
        body: JSON.stringify({ tags }),
      });

      if (!response.ok) {
        this.logger.warn(
          `Web revalidation request failed with status ${response.status} for tags: ${tags.join(', ')}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Web revalidation request errored for tags: ${tags.join(', ')}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
