import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { resyncSessionAction } from "@dashboard-lib/session-actions";
import { toMessage } from "@dashboard/utils/to-message";
import { usersApi } from "../api/api";
import type {
  CreateUserInput,
  ResetPasswordInput,
  SetUserRolesInput,
  UpdateUserProfileInput,
} from "../types/user.types";
import { usersQueryKey } from "./query-keys";

export function useUsers() {
  return useQuery({
    queryKey: usersQueryKey,
    queryFn: () => usersApi.list(),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateUserInput) => usersApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
      toast.success("User created");
    },
    onError: (error) => toast.error(toMessage(error, "Failed to create user")),
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateUserProfileInput }) =>
      usersApi.updateProfile(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
      toast.success("User updated");
    },
    onError: (error) => toast.error(toMessage(error, "Failed to update user")),
  });
}

export function useSetUserRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: SetUserRolesInput }) =>
      usersApi.setRoles(id, body),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
      await resyncSessionAction();
      toast.success("Roles updated");
    },
    onError: (error) => toast.error(toMessage(error, "Failed to update roles")),
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ResetPasswordInput }) =>
      usersApi.resetPassword(id, body),
    onSuccess: () => toast.success("Password reset"),
    onError: (error) =>
      toast.error(toMessage(error, "Failed to reset password")),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => usersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
      toast.success("User deleted");
    },
    onError: (error) => toast.error(toMessage(error, "Failed to delete user")),
  });
}
