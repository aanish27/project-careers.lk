import { PrismaService } from '@/database/prisma.service';
import { getSectorForCategory, SeoPageType } from '@careerslk/types';
import { Injectable } from '@nestjs/common';
import type { BuildSeoInputParams } from './seo-input.service';

const MAX_LINKS_PER_GROUP = 5;

/**
 * Computes related-page slugs per SRS 12.5/12.11.9. Only ever links to
 * pages that are currently isIndexable, so link authority never flows
 * toward a thin/deactivated page.
 */
@Injectable()
export class SeoLinksService {
  constructor(private readonly prisma: PrismaService) {}

  async buildRelatedLinks(
    params: Pick<
      BuildSeoInputParams,
      'pageType' | 'sector' | 'role' | 'location' | 'skill'
    >,
  ): Promise<string[]> {
    switch (params.pageType) {
      case SeoPageType.SECTOR:
        return this.sectorLinks(params.sector!);
      case SeoPageType.ROLE_LOCATION:
        return this.roleLocationLinks(params.role!.id, params.location!.id);
      case SeoPageType.ROLE:
        return this.roleLinks(params.role!.id, params.role!.name);
      case SeoPageType.LOCATION:
        return this.locationLinks(params.location!.id);
      case SeoPageType.SKILL:
        return this.skillLinks(params.skill!.id);
      case SeoPageType.REMOTE:
        return params.role
          ? this.roleLinks(params.role.id, params.role.name, true)
          : this.topRoleLinks();
      case SeoPageType.INTERNSHIP:
        return this.topRoleLinks();
      case SeoPageType.COMPANY:
      case SeoPageType.ALL_JOBS:
      case SeoPageType.HOME:
      default:
        return [];
    }
  }

  private async sectorLinks(sector: string) {
    const rolePages = await this.prisma.seoPage.findMany({
      where: { pageType: SeoPageType.ROLE, isIndexable: true },
      include: { role: { select: { name: true } } },
      take: MAX_LINKS_PER_GROUP * 3,
    });

    return rolePages
      .filter((page) => getSectorForCategory(page.role?.name) === sector)
      .slice(0, MAX_LINKS_PER_GROUP)
      .map((page) => page.slug);
  }

  private async roleLocationLinks(roleId: number, locationId: number) {
    const [sameLocation, sameRole, remoteVariant] = await Promise.all([
      this.prisma.seoPage.findMany({
        where: {
          pageType: SeoPageType.ROLE_LOCATION,
          locationId,
          roleId: { not: roleId },
          isIndexable: true,
        },
        select: { slug: true },
        take: MAX_LINKS_PER_GROUP,
      }),
      this.prisma.seoPage.findMany({
        where: {
          pageType: SeoPageType.ROLE_LOCATION,
          roleId,
          locationId: { not: locationId },
          isIndexable: true,
        },
        select: { slug: true },
        take: MAX_LINKS_PER_GROUP,
      }),
      this.prisma.seoPage.findFirst({
        where: { pageType: SeoPageType.REMOTE, roleId, isIndexable: true },
        select: { slug: true },
      }),
    ]);

    return [
      ...sameLocation.map((p) => p.slug),
      ...sameRole.map((p) => p.slug),
      ...(remoteVariant ? [remoteVariant.slug] : []),
    ];
  }

  private async roleLinks(
    roleId: number,
    roleName: string,
    excludeSelf = false,
  ) {
    const sector = getSectorForCategory(roleName);

    const [roleLocationPages, remoteVariant, sectorPage] = await Promise.all([
      this.prisma.seoPage.findMany({
        where: {
          pageType: SeoPageType.ROLE_LOCATION,
          roleId,
          isIndexable: true,
        },
        select: { slug: true },
        take: MAX_LINKS_PER_GROUP,
      }),
      excludeSelf
        ? this.prisma.seoPage.findFirst({
            where: { pageType: SeoPageType.ROLE, roleId, isIndexable: true },
            select: { slug: true },
          })
        : null,
      sector
        ? this.prisma.seoPage.findFirst({
            where: {
              pageType: SeoPageType.SECTOR,
              sector,
              isIndexable: true,
            },
            select: { slug: true },
          })
        : null,
    ]);

    return [
      ...roleLocationPages.map((p) => p.slug),
      ...(remoteVariant ? [remoteVariant.slug] : []),
      ...(sectorPage ? [sectorPage.slug] : []),
    ];
  }

  private async locationLinks(locationId: number) {
    const [roleLocationPages, location] = await Promise.all([
      this.prisma.seoPage.findMany({
        where: {
          pageType: SeoPageType.ROLE_LOCATION,
          locationId,
          isIndexable: true,
        },
        select: { slug: true },
        take: MAX_LINKS_PER_GROUP,
      }),
      this.prisma.seoLocation.findUnique({ where: { id: locationId } }),
    ]);

    const links = roleLocationPages.map((p) => p.slug);
    if (!location?.parentId) return links;

    // Hierarchical internal linking: up to the parent (province<-district,
    // district<-city) and across to a few siblings under the same parent.
    const [parentPage, siblings] = await Promise.all([
      this.prisma.seoPage.findFirst({
        where: {
          pageType: SeoPageType.LOCATION,
          locationId: location.parentId,
          isIndexable: true,
        },
        select: { slug: true },
      }),
      this.prisma.seoLocation.findMany({
        where: { parentId: location.parentId, id: { not: locationId } },
        select: { id: true },
        take: MAX_LINKS_PER_GROUP,
      }),
    ]);

    if (parentPage) links.push(parentPage.slug);

    if (siblings.length > 0) {
      const siblingPages = await this.prisma.seoPage.findMany({
        where: {
          pageType: SeoPageType.LOCATION,
          locationId: { in: siblings.map((s) => s.id) },
          isIndexable: true,
        },
        select: { slug: true },
        take: MAX_LINKS_PER_GROUP,
      });
      links.push(...siblingPages.map((p) => p.slug));
    }

    return links;
  }

  private async skillLinks(skillId: number) {
    const otherSkillPages = await this.prisma.seoPage.findMany({
      where: {
        pageType: SeoPageType.SKILL,
        skillId: { not: skillId },
        isIndexable: true,
      },
      select: { slug: true },
      take: MAX_LINKS_PER_GROUP,
    });

    return otherSkillPages.map((p) => p.slug);
  }

  private async topRoleLinks() {
    const rolePages = await this.prisma.seoPage.findMany({
      where: { pageType: SeoPageType.ROLE, isIndexable: true },
      select: { slug: true },
      orderBy: { jobCount: 'desc' },
      take: MAX_LINKS_PER_GROUP,
    });

    return rolePages.map((p) => p.slug);
  }
}
