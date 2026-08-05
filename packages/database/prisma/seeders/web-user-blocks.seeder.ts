import { PrismaClient } from '@careerslk/database';
import type { Conversation } from '@careerslk/database';
import { faker } from '@faker-js/faker';

// Blocks are seeded on top of existing conversations (rather than random
// user pairs) so the read-only-thread behavior has real data to exercise.
export async function seedWebUserBlocks(
  prisma: PrismaClient,
  conversations: Conversation[],
  count: number,
) {
  console.log(`Seeding ${count} blocks...`);

  const picked = faker.helpers.arrayElements(
    conversations,
    Math.min(count, conversations.length),
  );
  const blocks = [];

  for (const conversation of picked) {
    const blockerId = faker.helpers.arrayElement([
      conversation.participantOneId,
      conversation.participantTwoId,
    ]);
    const blockedId =
      blockerId === conversation.participantOneId
        ? conversation.participantTwoId
        : conversation.participantOneId;

    const block = await prisma.webUserBlock.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: {},
      create: { blockerId, blockedId },
    });
    blocks.push(block);
  }

  console.log(`  Seeded ${blocks.length} blocks`);
  return blocks;
}
