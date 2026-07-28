import { PrismaService } from '@/database/prisma.service';
import { JobStatus } from '@careerslk/types';
import { Injectable } from '@nestjs/common';
import { UpdateJobDto } from './dto/update-job.dto';

interface JobFilters {
  company?: string;
  status?: JobStatus;
}

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: JobFilters) {
    const where = {
      status: filters.status,
      company: filters.company ? { name: filters.company } : undefined,
      deletedAt: null,
    };
    return await this.prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true, logoUrl: true } },
      },
    });
  }

  async findOne(id: number) {
    return await this.prisma.job.findFirstOrThrow({
      where: { id, deletedAt: null },
      include: { company: true, keywords: true },
    });
  }

  async update(id: number, dto: UpdateJobDto) {
    return await this.prisma.job.update({ where: { id }, data: { ...dto } });
  }

  async softDelete(id: number) {
    return await this.prisma.job.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
