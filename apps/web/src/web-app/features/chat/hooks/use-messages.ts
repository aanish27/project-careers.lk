import { useQuery } from "@tanstack/react-query";
import { listMessages } from "../api/chat.actions";
import { chatKeys } from "./query-keys";

export function useMessages(conversationId: number) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: () => listMessages(conversationId),
    refetchInterval: 4000,
    enabled: Number.isFinite(conversationId),
  });
}
