import { BlockedUsersList } from "@/web-app/features/chat/components/blocked-users-list";
import { ConversationList } from "@/web-app/features/chat/components/conversation-list";
import { verifyWebUserSession } from "@/web-app/lib/web-user-session";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages | careers.lk",
  robots: { index: false },
};

export default async function MessagesPage() {
  await verifyWebUserSession();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Messages</h1>
      <ConversationList />
      <BlockedUsersList />
    </div>
  );
}
