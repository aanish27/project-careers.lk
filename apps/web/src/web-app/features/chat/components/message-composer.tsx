"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useSendMessage } from "../hooks/use-send-message";

export function MessageComposer({
  conversationId,
  isReadOnly,
}: {
  conversationId: number;
  isReadOnly: boolean;
}) {
  const [body, setBody] = useState("");
  const sendMessage = useSendMessage(conversationId);

  if (isReadOnly) {
    return (
      <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
        This conversation is read-only — one of you has blocked the other.
      </p>
    );
  }

  const onSend = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    sendMessage.mutate(trimmed, { onSuccess: () => setBody("") });
  };

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a message…"
        rows={3}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
      />
      {sendMessage.isError && (
        <p className="text-destructive text-sm">{sendMessage.error.message}</p>
      )}
      <Button
        onClick={onSend}
        disabled={sendMessage.isPending || body.trim().length === 0}
        className="self-end"
      >
        {sendMessage.isPending ? "Sending…" : "Send"}
      </Button>
    </div>
  );
}
