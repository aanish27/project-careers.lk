export interface CreateRoleInput {
  slug: string;
  name: string;
  description?: string;
  permissionIds?: number[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
}

export interface SetRolePermissionsInput {
  permissionIds: number[];
}
