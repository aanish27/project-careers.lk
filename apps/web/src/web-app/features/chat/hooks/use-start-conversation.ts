import type { StartConversationInput } from "@careerslk/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startConversation } from "../api/chat.actions";
import { chatKeys } from "./query-keys";

export function useStartConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: StartConversationInput) => {
      const result = await startConversation(input);
      if ("requiresAuth" in result) {
        throw new Error("REQUIRES_AUTH");
      }
      if ("error" in result) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}
