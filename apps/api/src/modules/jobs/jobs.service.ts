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

  async findAll(filters: JobFilters, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = {
      status: filters.status,
      company: filters.company ? { name: filters.company } : undefined,
    };
    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);
    return { items, page, limit, total };
  }

  async findOne(id: number) {
    return await this.prisma.job.findUniqueOrThrow({
      where: { id },
      include: { company: true, keywords: true },
    });
  }

  async update(id: number, dto: UpdateJobDto) {
    return await this.prisma.job.update({ where: { id }, data: { ...dto } });
  }

  async softDelete(id: number) {
    return await this.prisma.job.delete({ where: { id } });
  }
}
