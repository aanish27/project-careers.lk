import { useQuery } from "@tanstack/react-query";
import { getConversation } from "../api/chat.actions";
import { chatKeys } from "./query-keys";

export function useConversation(conversationId: number) {
  return useQuery({
    queryKey: chatKeys.conversation(conversationId),
    queryFn: () => getConversation(conversationId),
    refetchInterval: 15000,
    enabled: Number.isFinite(conversationId),
  });
}
