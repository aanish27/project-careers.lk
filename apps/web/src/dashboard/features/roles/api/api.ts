import type { Role } from "@careerslk/types";
import { api } from "@dashboard-lib/axios";
import type {
  CreateRoleInput,
  SetRolePermissionsInput,
  UpdateRoleInput,
} from "../types/role.types";

export const rolesApi = {
  list: () => api.get<Role[]>("/admin/roles").then((res) => res.data),
  get: (id: number) =>
    api.get<Role>(`/admin/roles/${id}`).then((res) => res.data),
  create: (body: CreateRoleInput) =>
    api.post<Role>("/admin/roles", body).then((res) => res.data),
  update: (id: number, body: UpdateRoleInput) =>
    api.patch<Role>(`/admin/roles/${id}`, body).then((res) => res.data),
  setPermissions: (id: number, body: SetRolePermissionsInput) =>
    api
      .put<Role>(`/admin/roles/${id}/permissions`, body)
      .then((res) => res.data),
  remove: (id: number) =>
    api.delete<void>(`/admin/roles/${id}`).then((res) => res.data),
};
