import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blockUser } from "../api/chat.actions";
import { chatKeys } from "./query-keys";

export function useBlockUser(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedWebUserId: number) => {
      const result = await blockUser({ blockedWebUserId });
      if ("requiresAuth" in result) throw new Error("REQUIRES_AUTH");
      if ("error" in result) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversation(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: chatKeys.blockedUsers() });
    },
  });
}
