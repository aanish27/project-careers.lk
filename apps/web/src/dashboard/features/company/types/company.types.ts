import type { Company } from "@careerslk/types";

export type { Company };

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
