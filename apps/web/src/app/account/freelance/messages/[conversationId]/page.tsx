import { ConversationView } from "@/web-app/features/chat/components/conversation-view";
import { verifyWebUserSession } from "@/web-app/lib/web-user-session";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conversation | careers.lk",
  robots: { index: false },
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  await verifyWebUserSession();
  const { conversationId } = await params;

  return (
    <div>
      <ConversationView conversationId={Number(conversationId)} />
    </div>
  );
}
