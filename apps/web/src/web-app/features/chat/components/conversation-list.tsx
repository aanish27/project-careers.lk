"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message";
import Link from "next/link";
import { useConversations } from "../hooks/use-conversations";

export function ConversationList() {
  const { data: conversations, isLoading } = useConversations();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading conversations…</p>;
  }

  if (!conversations || conversations.length === 0) {
    return (
      <p className="text-muted-foreground">
        No conversations yet. Message a freelancer or gig poster to start one.
      </p>
    );
  }

  return (
    <MessageGroup>
      {conversations.map((conversation) => {
        const { otherParticipant } = conversation;
        const name =
          [otherParticipant.firstName, otherParticipant.lastName]
            .filter(Boolean)
            .join(" ") || "User";
        const initials = name.slice(0, 2).toUpperCase();

        return (
          <Link
            key={conversation.id}
            href={`/account/freelance/messages/${conversation.id}`}
            className="rounded-xl border border-border bg-white p-3 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <Message align="start">
              <MessageAvatar>
                <Avatar>
                  {otherParticipant.avatarUrl && (
                    <AvatarImage src={otherParticipant.avatarUrl} alt={name} />
                  )}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <MessageHeader className="flex items-center justify-between gap-2 px-0">
                  <span className="font-semibold text-foreground">{name}</span>
                  {conversation.isReadOnly && (
                    <Badge variant="outline" className="text-xs">
                      Read-only
                    </Badge>
                  )}
                </MessageHeader>
                {conversation.contextLabel && (
                  <span className="px-0 text-xs text-muted-foreground">
                    Re: {conversation.contextLabel.title}
                  </span>
                )}
                {conversation.lastMessageAt && (
                  <MessageFooter className="px-0">
                    {new Date(conversation.lastMessageAt).toLocaleString()}
                  </MessageFooter>
                )}
              </MessageContent>
            </Message>
          </Link>
        );
      })}
    </MessageGroup>
  );
}
