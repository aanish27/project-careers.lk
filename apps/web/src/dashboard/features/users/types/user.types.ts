import type { AdminUser } from "@careerslk/types";

export type { AdminUser };

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds?: number[];
}

export interface UpdateUserProfileInput {
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export interface SetUserRolesInput {
  roleIds: number[];
}

export interface ResetPasswordInput {
  password: string;
}
