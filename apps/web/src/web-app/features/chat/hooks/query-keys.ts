export const chatKeys = {
  all: ["chat"] as const,
  conversations: () => [...chatKeys.all, "conversations"] as const,
  conversation: (id: number) => [...chatKeys.all, "conversation", id] as const,
  messages: (conversationId: number) =>
    [...chatKeys.all, "messages", conversationId] as const,
  blockedUsers: () => [...chatKeys.all, "blocked-users"] as const,
};
