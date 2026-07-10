import { PrismaService } from '@/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { AssignJobKeywordDto } from './dto/assign-job-keyword.dto';
import { CreateKeywordDto } from './dto/create-keyword.dto';
import { UpdateJobKeywordDto } from './dto/update-job-keyword.dto';
import { UpdateKeywordDto } from './dto/update-keyword.dto';

@Injectable()
export class KeywordsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateKeywordDto) {
    return await this.prisma.keyword.create({ data: { name: dto.name } });
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.keyword.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, _count: { select: { jobs: true } } },
      }),
      this.prisma.keyword.count(),
    ]);
    return { items, page, limit, total };
  }

  async findOne(id: number) {
    return await this.prisma.keyword.findUniqueOrThrow({
      where: { id },
      include: { jobs: { include: { job: true } } },
    });
  }

  async update(id: number, dto: UpdateKeywordDto) {
    return await this.prisma.keyword.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async remove(id: number) {
    return await this.prisma.keyword.delete({ where: { id } });
  }

  async assignToJob(jobId: number, dto: AssignJobKeywordDto) {
    const keyword = await this.prisma.keyword.upsert({
      where: { name: dto.name },
      update: {},
      create: { name: dto.name },
    });

    return await this.prisma.jobKeyword.upsert({
      where: { jobId_keywordId: { jobId, keywordId: keyword.id } },
      update: { editedByAdmin: dto.editedByAdmin ?? false },
      create: {
        jobId,
        keywordId: keyword.id,
        editedByAdmin: dto.editedByAdmin ?? false,
      },
    });
  }

  async updateJobKeyword(
    jobId: number,
    keywordId: number,
    dto: UpdateJobKeywordDto,
  ) {
    return await this.prisma.jobKeyword.update({
      where: { jobId_keywordId: { jobId, keywordId } },
      data: { editedByAdmin: dto.editedByAdmin },
    });
  }

  async removeJobKeyword(jobId: number, keywordId: number) {
    return await this.prisma.jobKeyword.delete({
      where: { jobId_keywordId: { jobId, keywordId } },
    });
  }
}
