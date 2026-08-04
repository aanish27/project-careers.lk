"use client";

import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@jobboard/hooks/use-require-auth";
import { useWebUser } from "@jobboard/providers/web-user-provider";
import { useRouter } from "next/navigation";
import { useStartConversation } from "../hooks/use-start-conversation";

export function MessageButton({
  otherWebUserId,
  gigId,
  freelanceProfileId,
}: {
  otherWebUserId: number;
  gigId?: number;
  freelanceProfileId?: number;
}) {
  const { user, openLoginModal } = useWebUser();
  const requireAuth = useRequireAuth();
  const startConversation = useStartConversation();
  const router = useRouter();

  // Never show a "Message" button pointed at yourself.
  if (user?.id === otherWebUserId) return null;

  const onClick = () => {
    requireAuth(() => {
      startConversation.mutate(
        { otherWebUserId, gigId, freelanceProfileId },
        {
          onSuccess: (conversation) => {
            router.push(`/freelance/messages/${conversation.id}`);
          },
          onError: (err) => {
            if (err.message === "REQUIRES_AUTH") openLoginModal();
          },
        },
      );
    });
  };

  return (
    <Button onClick={onClick} disabled={startConversation.isPending}>
      {startConversation.isPending ? "Starting…" : "Message"}
    </Button>
  );
}
