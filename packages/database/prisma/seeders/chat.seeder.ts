import { PrismaClient } from '@careerslk/database';
import type {
  ChatMessage,
  Conversation,
  FreelanceProfile,
  Gig,
  WebUser,
} from '@careerslk/database';
import { faker } from '@faker-js/faker';

// Mirrors WebUserChatService.pair() — participantOneId is always the
// smaller id, so seeded rows respect the same invariant the app relies on.
function pair(a: number, b: number): { one: number; two: number } {
  return a < b ? { one: a, two: b } : { one: b, two: a };
}

export async function seedConversations(
  prisma: PrismaClient,
  webUsers: WebUser[],
  gigs: Gig[],
  profiles: FreelanceProfile[],
  count: number,
): Promise<{ conversations: Conversation[]; messages: ChatMessage[] }> {
  console.log(`Seeding ${count} conversations...`);

  const conversations: Conversation[] = [];
  const messages: ChatMessage[] = [];
  const usedPairs = new Set<string>();

  for (let i = 0; i < count && webUsers.length >= 2; i++) {
    let participantOneId!: number;
    let participantTwoId!: number;
    let pairKey!: string;
    let found = false;

    for (let attempt = 0; attempt < 20; attempt++) {
      const [a, b] = faker.helpers.arrayElements(webUsers, 2);
      if (a!.id === b!.id) continue;
      const { one, two } = pair(a!.id, b!.id);
      const key = `${one}:${two}`;
      if (usedPairs.has(key)) continue;

      participantOneId = one;
      participantTwoId = two;
      pairKey = key;
      found = true;
      break;
    }
    if (!found) continue;
    usedPairs.add(pairKey);

    const useGigContext =
      gigs.length > 0 && faker.datatype.boolean({ probability: 0.5 });
    const contextGig = useGigContext ? faker.helpers.arrayElement(gigs) : null;
    const contextProfile =
      !contextGig &&
      profiles.length > 0 &&
      faker.datatype.boolean({ probability: 0.6 })
        ? faker.helpers.arrayElement(profiles)
        : null;

    const conversation = await prisma.conversation.upsert({
      where: {
        participantOneId_participantTwoId: {
          participantOneId,
          participantTwoId,
        },
      },
      update: {},
      create: {
        participantOneId,
        participantTwoId,
        contextGigId: contextGig?.id,
        contextFreelanceProfileId: contextProfile?.id,
      },
    });

    const messageCount = faker.number.int({ min: 1, max: 8 });
    const senders = [participantOneId, participantTwoId];
    let cursor = faker.date.recent({ days: 10 });
    let lastMessage: ChatMessage | null = null;

    for (let m = 0; m < messageCount; m++) {
      cursor = faker.date.soon({ days: 1, refDate: cursor });
      lastMessage = await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: senders[m % 2]!,
          body: faker.lorem.sentence(),
          createdAt: cursor,
        },
      });
      messages.push(lastMessage);
    }

    if (lastMessage) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: lastMessage.createdAt },
      });
    }

    conversations.push(conversation);
  }

  console.log(
    `  Seeded ${conversations.length} conversations, ${messages.length} messages`,
  );
  return { conversations, messages };
}
