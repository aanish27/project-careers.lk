import { PrismaService } from '@/database/prisma.service';
import { assertNotSsrf } from '@careerslk/types';
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

  async create(createCompanyDto: CreateCompanyDto) {
    await this.assertUrlsNotSsrf(
      createCompanyDto.careerUrl,
      createCompanyDto.websiteUrl,
      createCompanyDto.logoUrl,
    );

    return await this.prisma.company.create({ data: createCompanyDto });
  }

  async findAll() {
    return await this.prisma.company.findMany();
  }

  async findOne(id: number) {
    return await this.prisma.company.findUniqueOrThrow({ where: { id: id } });
  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto) {
    await this.assertUrlsNotSsrf(
      updateCompanyDto.careerUrl,
      updateCompanyDto.websiteUrl,
      updateCompanyDto.logoUrl,
    );

    return await this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });
  }

  async remove(id: number) {
    return await this.prisma.company.Soft({ where: { id } });
  }
}
