import type { CompanyStatus, PaginationType } from '../enums';

export interface Company {
  id: number;
  name: string;
  logoUrl: string | null;
  websiteUrl: string;
  careerUrl: string;
  atsPlatform: string | null;
  status: CompanyStatus;
  htmlSelector: string | null;
  htmlSelectorType: string | null;
  paginationType: PaginationType | null;
  paginationBtn: string | null;
  createdAt: string;
  updatedAt: string;
}
