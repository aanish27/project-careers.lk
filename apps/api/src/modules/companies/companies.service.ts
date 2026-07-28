import { PrismaService } from '@/database/prisma.service';
import { AUDIT_ACTIONS } from '@/modules/audit/audit.constant';
import { AuditContext, AuditService } from '@/modules/audit/audit.service';
import { assertNotSsrf } from '@careerslk/lib/ssrf';
import { CreateCompanyInput, UpdateCompanyInput } from '@careerslk/types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private assertUrlsNotSsrf(...urls: (string | undefined)[]) {
    return Promise.all(
      urls.filter((url): url is string => !!url).map(assertNotSsrf),
    );
  }

  async create(dto: CreateCompanyInput, context: AuditContext) {
    await this.assertUrlsNotSsrf(dto.careerUrl, dto.websiteUrl, dto.logoUrl);

    return await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
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

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.COMPANY_CREATED,
          entityType: 'company',
          entityId: company.id,
          newValue: { name: company.name, websiteUrl: company.websiteUrl },
        },
        tx,
      );

      return company;
    });
  }

  async findAll() {
    return await this.prisma.company.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return await this.prisma.company.findFirstOrThrow({
      where: { id, deletedAt: null },
    });
  }

  async update(id: number, dto: UpdateCompanyInput, context: AuditContext) {
    await this.assertUrlsNotSsrf(dto.careerUrl, dto.websiteUrl, dto.logoUrl);

    return await this.prisma.$transaction(async (tx) => {
      const before = await tx.company.findFirstOrThrow({
        where: { id, deletedAt: null },
      });

      const company = await tx.company.update({
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

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.COMPANY_UPDATED,
          entityType: 'company',
          entityId: company.id,
          oldValue: { name: before.name, status: before.status },
          newValue: { name: company.name, status: company.status },
        },
        tx,
      );

      return company;
    });
  }

  async softDelete(id: number, context: AuditContext) {
    return await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.COMPANY_DELETED,
          entityType: 'company',
          entityId: company.id,
          oldValue: { name: company.name },
        },
        tx,
      );

      return company;
    });
  }
}
