import type { CompanyStatus, PaginationType } from "@careerslk/types";

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

export type CompanyListResponse = Company[];

export type CreateCompanyInput = Pick<
  Company,
  "name" | "websiteUrl" | "careerUrl" | "status"
> &
  Partial<
    Pick<
      Company,
      | "logoUrl"
      | "atsPlatform"
      | "htmlSelector"
      | "htmlSelectorType"
      | "paginationBtn"
      | "paginationType"
    >
  >;

export type UpdateCompanyInput = Partial<CreateCompanyInput>;
