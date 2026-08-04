export * from './schemas';

export interface Conversation {
  id: number;
  participantOneId: number;
  participantTwoId: number;
  contextGigId: number | null;
  contextFreelanceProfileId: number | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  body: string;
  createdAt: string;
}

export interface ConversationOtherParticipant {
  id: number;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

export interface ConversationContextLabel {
  type: 'gig' | 'freelanceProfile';
  id: number;
  title: string;
}

export interface ConversationWithParticipant extends Conversation {
  otherParticipant: ConversationOtherParticipant;
  isReadOnly: boolean;
  contextLabel: ConversationContextLabel | null;
}

export interface ChatMessageWithSender extends ChatMessage {
  sender: ConversationOtherParticipant;
}
