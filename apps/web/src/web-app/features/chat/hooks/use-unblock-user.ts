import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unblockUser } from "../api/chat.actions";
import { chatKeys } from "./query-keys";

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedWebUserId: number) => {
      const result = await unblockUser(blockedWebUserId);
      if ("requiresAuth" in result) throw new Error("REQUIRES_AUTH");
      if ("error" in result) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      // Any thread with this user may have flipped back to writable, and
      // the inbox's read-only badges need to catch up too — invalidate
      // broadly rather than tracking which conversation(s) it affects.
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}
