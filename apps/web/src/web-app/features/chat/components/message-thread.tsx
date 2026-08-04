"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
} from "@/components/ui/message";
import { useWebUser } from "@jobboard/providers/web-user-provider";
import { useMessages } from "../hooks/use-messages";

function initialsOf(name: string): string {
  return name.slice(0, 2).toUpperCase() || "?";
}

export function MessageThread({ conversationId }: { conversationId: number }) {
  const { data: messages, isLoading } = useMessages(conversationId);
  const { user } = useWebUser();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading messages…</p>;
  }

  if (!messages || messages.length === 0) {
    return (
      <p className="text-muted-foreground">No messages yet — say hello.</p>
    );
  }

  return (
    <MessageGroup>
      {messages
        .slice()
        .reverse()
        .map((message) => {
          const isMine = message.senderId === user?.id;
          const name =
            [message.sender.firstName, message.sender.lastName]
              .filter(Boolean)
              .join(" ") || "User";

          return (
            <Message key={message.id} align={isMine ? "end" : "start"}>
              <MessageAvatar>
                <Avatar size="sm">
                  {message.sender.avatarUrl && (
                    <AvatarImage src={message.sender.avatarUrl} alt={name} />
                  )}
                  <AvatarFallback>{initialsOf(name)}</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <div
                  className={
                    isMine
                      ? "rounded-2xl bg-primary px-4 py-2 text-primary-foreground"
                      : "rounded-2xl bg-muted px-4 py-2 text-foreground"
                  }
                >
                  {message.body}
                </div>
                <MessageFooter>
                  {new Date(message.createdAt).toLocaleTimeString()}
                </MessageFooter>
              </MessageContent>
            </Message>
          );
        })}
    </MessageGroup>
  );
}
