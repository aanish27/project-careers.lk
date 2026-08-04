import type {
  FreelanceApprovalStatus,
  FreelanceProfileWithInternalNotes,
} from "@careerslk/types";
import { api } from "@dashboard-lib/axios";

export interface FreelanceProfileWithWebUser extends FreelanceProfileWithInternalNotes {
  webUser: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface FreelanceProfileFilters {
  approvalStatus?: FreelanceApprovalStatus;
  category?: string;
  webUserId?: number;
}

export interface RejectFreelanceProfileInput {
  reason?: string;
  internalNotes?: string;
}

export const freelanceProfilesApi = {
  list: (filters?: FreelanceProfileFilters) =>
    api
      .get<FreelanceProfileWithWebUser[]>("/admin/freelance-profiles", {
        params: filters,
      })
      .then((res) => res.data),
  get: (id: number) =>
    api
      .get<FreelanceProfileWithWebUser>(`/admin/freelance-profiles/${id}`)
      .then((res) => res.data),
  remove: (id: number) =>
    api.delete<void>(`/admin/freelance-profiles/${id}`).then((res) => res.data),
  approve: (id: number) =>
    api
      .post<FreelanceProfileWithWebUser>(
        `/admin/freelance-profiles/${id}/approve`,
      )
      .then((res) => res.data),
  reject: (id: number, dto: RejectFreelanceProfileInput) =>
    api
      .post<FreelanceProfileWithWebUser>(
        `/admin/freelance-profiles/${id}/reject`,
        dto,
      )
      .then((res) => res.data),
};
