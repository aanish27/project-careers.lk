import { api } from "@dashboard-lib/axios";
import type {
  Company,
  CompanyListResponse,
  CreateCompanyInput,
  UpdateCompanyInput,
} from "../types/company.types";

export const companyApi = {
  list: () =>
    api.get<CompanyListResponse>("/companies").then((res) => res.data),
  get: (id: number) =>
    api.get<Company>(`/companies/${id}`).then((res) => res.data),
  create: (body: CreateCompanyInput) =>
    api.post<Company>("/companies", body).then((res) => res.data),
  update: (id: number, body: UpdateCompanyInput) =>
    api.patch<Company>(`/companies/${id}`, body).then((res) => res.data),
  remove: (id: number) =>
    api.delete<Company>(`/companies/${id}`).then((res) => res.data),
};
