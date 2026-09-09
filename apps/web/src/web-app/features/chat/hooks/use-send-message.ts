import { RATE_LIMIT_MESSAGE } from "@lib/messages";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sendMessage } from "../api/chat.actions";
import { chatKeys } from "./query-keys";

export function useSendMessage(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) => {
      const result = await sendMessage(conversationId, { body });
      if ("requiresAuth" in result) {
        throw new Error("Your session expired — please sign in again.");
      }
      if ("error" in result) throw new Error(result.error);
      return result.data;
    },
    onError: (error) => {
      if (error.message === RATE_LIMIT_MESSAGE) toast.error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}
