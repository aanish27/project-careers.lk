import type {
  FreelanceApprovalStatus,
  GigWithInternalNotes,
} from "@careerslk/types";
import { api } from "@dashboard-lib/axios";

export interface GigWithWebUser extends GigWithInternalNotes {
  postedBy: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface GigFilters {
  approvalStatus?: FreelanceApprovalStatus;
  category?: string;
  postedByWebUserId?: number;
}

export interface RejectGigInput {
  reason?: string;
  internalNotes?: string;
}

export const gigsApi = {
  list: (filters?: GigFilters) =>
    api
      .get<GigWithWebUser[]>("/admin/gigs", { params: filters })
      .then((res) => res.data),
  get: (id: number) =>
    api.get<GigWithWebUser>(`/admin/gigs/${id}`).then((res) => res.data),
  remove: (id: number) =>
    api.delete<void>(`/admin/gigs/${id}`).then((res) => res.data),
  approve: (id: number) =>
    api
      .post<GigWithWebUser>(`/admin/gigs/${id}/approve`)
      .then((res) => res.data),
  reject: (id: number, dto: RejectGigInput) =>
    api
      .post<GigWithWebUser>(`/admin/gigs/${id}/reject`, dto)
      .then((res) => res.data),
};
