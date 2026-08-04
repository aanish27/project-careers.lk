import { useQuery } from "@tanstack/react-query";
import { listConversations } from "../api/chat.actions";
import { chatKeys } from "./query-keys";

export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: () => listConversations(),
    refetchInterval: 15000,
  });
}
