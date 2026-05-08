import { prisma } from '@careerslk/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaService {
  public readonly prisma = prisma;
}
