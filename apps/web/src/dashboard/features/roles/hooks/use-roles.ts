import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { resyncSessionAction } from "@dashboard-lib/session-actions";
import { toMessage } from "@dashboard/utils/to-message";
import { rolesApi } from "../api/api";
import type {
  CreateRoleInput,
  SetRolePermissionsInput,
  UpdateRoleInput,
} from "../types/role.types";
import { rolesQueryKey } from "./query-keys";

export function useRoles() {
  return useQuery({
    queryKey: rolesQueryKey,
    queryFn: () => rolesApi.list(),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateRoleInput) => rolesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey });
      toast.success("Role created");
    },
    onError: (error) => toast.error(toMessage(error, "Failed to create role")),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateRoleInput }) =>
      rolesApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey });
      toast.success("Role updated");
    },
    onError: (error) => toast.error(toMessage(error, "Failed to update role")),
  });
}

export function useSetRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: SetRolePermissionsInput }) =>
      rolesApi.setPermissions(id, body),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey });
      await resyncSessionAction();
      toast.success("Permissions updated");
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to update permissions")),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => rolesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey });
      toast.success("Role deleted");
    },
    onError: (error) => toast.error(toMessage(error, "Failed to delete role")),
  });
}
