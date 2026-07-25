import { Injectable, Logger } from '@nestjs/common';
import { PrincipalService, PrincipalSnapshot } from './principal.service';

export const PRINCIPAL_CACHE = Symbol('PRINCIPAL_CACHE');

export interface IPrincipalCache {
  get(userId: number): Promise<PrincipalSnapshot | null>;
  invalidate(userId: number): void;
  invalidateAll(): void;
}

interface CacheEntry {
  snapshot: PrincipalSnapshot | null;
  expiresAt: number;
}

@Injectable()
export class InMemoryPrincipalCache implements IPrincipalCache {
  private readonly logger = new Logger(InMemoryPrincipalCache.name);
  private readonly entries = new Map<number, CacheEntry>();
  private readonly ttlMs = 30_000;
  private readonly maxEntries = 10_000;

  constructor(private readonly principals: PrincipalService) {}

  async get(userId: number): Promise<PrincipalSnapshot | null> {
    const now = Date.now();
    const cached = this.entries.get(userId);

    if (cached && cached.expiresAt > now) {
      return cached.snapshot;
    }

    const snapshot = await this.principals.load(userId);
    this.set(userId, snapshot, now);

    return snapshot;
  }

  private set(
    userId: number,
    snapshot: PrincipalSnapshot | null,
    now: number,
  ): void {
    if (this.entries.size >= this.maxEntries && !this.entries.has(userId)) {
      const oldest = this.entries.keys().next();
      if (!oldest.done) {
        this.entries.delete(oldest.value);
      }
    }

    this.entries.set(userId, { snapshot, expiresAt: now + this.ttlMs });
  }

  invalidate(userId: number): void {
    if (this.entries.delete(userId)) {
      this.logger.debug(`Invalidated cached principal for user ${userId}`);
    }
  }

  invalidateAll(): void {
    this.entries.clear();
    this.logger.debug('Invalidated all cached principals');
  }
}
