"use server";

import type {
  BlockUserInput,
  ChatMessageWithSender,
  ConversationWithParticipant,
  SendMessageInput,
  StartConversationInput,
} from "@careerslk/types";
import { ApiError } from "@lib/api-client";
import {
  blockUserRequest,
  getConversationRequest,
  listBlockedUsersRequest,
  listConversationsRequest,
  listMessagesRequest,
  sendMessageRequest,
  startConversationRequest,
  unblockUserRequest,
} from "@web-app-lib/chat-client";
import { getValidWebUserAccessToken } from "@web-app-lib/web-user-session";

async function requireAccessToken(): Promise<string> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) throw new Error("Not authenticated");
  return accessToken;
}

// Read actions — called directly as TanStack Query `queryFn`s, so they
// throw on failure rather than returning a discriminated result (the pages
// that render these hooks already gate on `verifyWebUserSession()`, so a
// missing token here only happens if the session expired mid-poll).
export async function listConversations(): Promise<
  ConversationWithParticipant[]
> {
  const accessToken = await requireAccessToken();
  return listConversationsRequest(accessToken);
}

export async function getConversation(
  conversationId: number,
): Promise<ConversationWithParticipant> {
  const accessToken = await requireAccessToken();
  return getConversationRequest(accessToken, conversationId);
}

export async function listMessages(
  conversationId: number,
): Promise<ChatMessageWithSender[]> {
  const accessToken = await requireAccessToken();
  return listMessagesRequest(accessToken, conversationId);
}

export async function listBlockedUsers() {
  const accessToken = await requireAccessToken();
  return listBlockedUsersRequest(accessToken);
}

// Write actions — same discriminated-result shape as the rest of this
// codebase's mutation actions (see freelance.actions.ts).
export type ChatActionResult<T> =
  | { ok: true; data: T }
  | { requiresAuth: true }
  | { error: string };

export async function startConversation(
  input: StartConversationInput,
): Promise<ChatActionResult<ConversationWithParticipant>> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return { requiresAuth: true };

  try {
    const data = await startConversationRequest(accessToken, input);
    return { ok: true, data };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }
}

export async function sendMessage(
  conversationId: number,
  input: SendMessageInput,
): Promise<ChatActionResult<ChatMessageWithSender>> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return { requiresAuth: true };

  try {
    const data = await sendMessageRequest(accessToken, conversationId, input);
    return { ok: true, data };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }
}

export async function blockUser(
  input: BlockUserInput,
): Promise<ChatActionResult<null>> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return { requiresAuth: true };

  try {
    await blockUserRequest(accessToken, input);
    return { ok: true, data: null };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }
}

export async function unblockUser(
  blockedWebUserId: number,
): Promise<ChatActionResult<null>> {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) return { requiresAuth: true };

  try {
    await unblockUserRequest(accessToken, blockedWebUserId);
    return { ok: true, data: null };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: "Something went wrong. Please try again." };
  }
}
