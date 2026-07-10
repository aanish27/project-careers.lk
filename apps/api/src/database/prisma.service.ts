import { createSoftDeleteExtension } from '@candoimage/prisma-extension-soft-delete';
import { PrismaClient } from '@careerslk/database';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(configService: ConfigService) {
    const databaseUrl = configService.getOrThrow<string>('DATABASE_URL');

    const pool = new Pool({
      connectionString: databaseUrl,
    });

    const adapter = new PrismaPg(pool);
    super({
      adapter,
      log: ['info', 'warn', 'error'],
      omit: { user: { password: true } },
    });
    this.$extends(
      createSoftDeleteExtension({
        models: {
          User: true,
          Company: true,
          Job: true,
        },
        defaultConfig: {
          field: 'deletedAt',
          createValue: (deleted) => {
            if (deleted) return new Date();
            return null;
          },
        },
      }),
    );
  }
}
