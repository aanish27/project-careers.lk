import { useQuery } from "@tanstack/react-query";
import { listBlockedUsers } from "../api/chat.actions";
import { chatKeys } from "./query-keys";

export function useBlockedUsers() {
  return useQuery({
    queryKey: chatKeys.blockedUsers(),
    queryFn: () => listBlockedUsers(),
  });
}
