"use client";

import { ReportButton } from "@web-app-features/reports/components/report-button";
import Link from "next/link";
import { useConversation } from "../hooks/use-conversation";
import { BlockButton } from "./block-button";
import { MessageComposer } from "./message-composer";
import { MessageThread } from "./message-thread";

export function ConversationView({
  conversationId,
}: {
  conversationId: number;
}) {
  const { data: conversation, isLoading } = useConversation(conversationId);

  if (isLoading || !conversation) {
    return <p className="text-muted-foreground">Loading conversation…</p>;
  }

  const name =
    [
      conversation.otherParticipant.firstName,
      conversation.otherParticipant.lastName,
    ]
      .filter(Boolean)
      .join(" ") || "User";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Link
            href="/freelance/messages"
            className="text-xs text-muted-foreground hover:underline"
          >
            ← All conversations
          </Link>
          <h1 className="text-xl font-bold text-foreground">{name}</h1>
          {conversation.contextLabel && (
            <p className="text-xs text-muted-foreground">
              Re: {conversation.contextLabel.title}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ReportButton
            entityType="CHAT_THREAD"
            entityId={conversation.id}
            label="Report"
          />
          {!conversation.isReadOnly && (
            <BlockButton
              conversationId={conversation.id}
              otherWebUserId={conversation.otherParticipant.id}
            />
          )}
        </div>
      </div>

      <MessageThread conversationId={conversationId} />
      <MessageComposer
        conversationId={conversationId}
        isReadOnly={conversation.isReadOnly}
      />
    </div>
  );
}
