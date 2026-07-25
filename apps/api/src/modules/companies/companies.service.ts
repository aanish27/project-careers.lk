import { PrismaService } from '@/database/prisma.service';
import { assertNotSsrf } from '@careerslk/lib/ssrf';
import { Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  private assertUrlsNotSsrf(...urls: (string | undefined)[]) {
    return Promise.all(
      urls.filter((url): url is string => !!url).map(assertNotSsrf),
    );
  }

  async create(dto: CreateCompanyDto) {
    await this.assertUrlsNotSsrf(dto.careerUrl, dto.websiteUrl, dto.logoUrl);

    return await this.prisma.company.create({
      data: {
        name: dto.name,
        websiteUrl: dto.websiteUrl,
        logoUrl: dto.logoUrl,
        careerUrl: dto.careerUrl,
        atsPlatform: dto.atsPlatform,
        htmlSelector: dto.htmlSelector,
        htmlSelectorType: dto.htmlSelectorType,
        status: dto.status,
        paginationType: dto.paginationType,
        paginationBtn: dto.paginationBtn,
      },
    });
  }

  async findAll() {
    return await this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return await this.prisma.company.findUniqueOrThrow({ where: { id: id } });
  }

  async update(id: number, dto: UpdateCompanyDto) {
    await this.assertUrlsNotSsrf(dto.careerUrl, dto.websiteUrl, dto.logoUrl);

    return await this.prisma.company.update({
      where: { id },
      data: {
        name: dto.name,
        websiteUrl: dto.websiteUrl,
        logoUrl: dto.logoUrl,
        careerUrl: dto.careerUrl,
        atsPlatform: dto.atsPlatform,
        htmlSelector: dto.htmlSelector,
        htmlSelectorType: dto.htmlSelectorType,
        status: dto.status,
        paginationType: dto.paginationType,
        paginationBtn: dto.paginationBtn,
      },
    });
  }

  async softDelete(id: number) {
    return await this.prisma.company.delete({ where: { id } });
  }
}
