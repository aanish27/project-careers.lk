import type {
  BlockedWebUser,
  BlockUserInput,
  ChatMessageWithSender,
  ConversationWithParticipant,
  SendMessageInput,
  StartConversationInput,
} from "@careerslk/types";
import { apiFetch } from "@lib/api-client";
import "server-only";

export async function startConversationRequest(
  accessToken: string,
  input: StartConversationInput,
): Promise<ConversationWithParticipant> {
  const { data } = await apiFetch<ConversationWithParticipant>(
    "/web-users/chat/conversations",
    {
      method: "POST",
      body: JSON.stringify(input),
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  return data;
}

export async function listConversationsRequest(
  accessToken: string,
): Promise<ConversationWithParticipant[]> {
  const { data } = await apiFetch<ConversationWithParticipant[]>(
    "/web-users/chat/conversations",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return data;
}

export async function getConversationRequest(
  accessToken: string,
  conversationId: number,
): Promise<ConversationWithParticipant> {
  const { data } = await apiFetch<ConversationWithParticipant>(
    `/web-users/chat/conversations/${conversationId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return data;
}

export async function listMessagesRequest(
  accessToken: string,
  conversationId: number,
): Promise<ChatMessageWithSender[]> {
  const { data } = await apiFetch<ChatMessageWithSender[]>(
    `/web-users/chat/conversations/${conversationId}/messages`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return data;
}

export async function sendMessageRequest(
  accessToken: string,
  conversationId: number,
  input: SendMessageInput,
): Promise<ChatMessageWithSender> {
  const { data } = await apiFetch<ChatMessageWithSender>(
    `/web-users/chat/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(input),
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  return data;
}

export async function blockUserRequest(
  accessToken: string,
  input: BlockUserInput,
): Promise<void> {
  await apiFetch("/web-users/blocks", {
    method: "POST",
    body: JSON.stringify(input),
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function unblockUserRequest(
  accessToken: string,
  blockedWebUserId: number,
): Promise<void> {
  await apiFetch(`/web-users/blocks/${blockedWebUserId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function listBlockedUsersRequest(
  accessToken: string,
): Promise<BlockedWebUser[]> {
  const { data } = await apiFetch<BlockedWebUser[]>("/web-users/blocks", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}
