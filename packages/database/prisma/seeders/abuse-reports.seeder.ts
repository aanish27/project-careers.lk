import {
  AbuseReportCategory,
  AbuseReportEntityType,
  AbuseReportStatus,
  PrismaClient,
} from '@careerslk/database';
import type {
  ChatMessage,
  Conversation,
  FreelanceProfile,
  Gig,
  WebUser,
} from '@careerslk/database';
import { faker } from '@faker-js/faker';

const SNAPSHOT_MAX_LENGTH = 2000;
const CATEGORIES = Object.values(AbuseReportCategory);

interface ReportSeedInput {
  entityType: AbuseReportEntityType;
  entityId: number;
  contentSnapshot: string;
  reporterWebUserId: number;
}

// Mirrors WebUserReportsService.resolveContentSnapshot() closely enough for
// realistic seed data — a reporter is never the entity's own owner/sender.
function buildCandidate(
  webUsers: WebUser[],
  profiles: FreelanceProfile[],
  gigs: Gig[],
  conversations: Conversation[],
  messages: ChatMessage[],
): ReportSeedInput | null {
  const entityType = faker.helpers.arrayElement([
    AbuseReportEntityType.FREELANCE_PROFILE,
    AbuseReportEntityType.GIG,
    AbuseReportEntityType.CHAT_MESSAGE,
    AbuseReportEntityType.CHAT_THREAD,
  ]);

  switch (entityType) {
    case AbuseReportEntityType.FREELANCE_PROFILE: {
      if (profiles.length === 0) return null;
      const profile = faker.helpers.arrayElement(profiles);
      const reporter = faker.helpers.arrayElement(
        webUsers.filter((u) => u.id !== profile.webUserId),
      );
      if (!reporter) return null;
      return {
        entityType,
        entityId: profile.id,
        contentSnapshot: profile.bio ?? '',
        reporterWebUserId: reporter.id,
      };
    }

    case AbuseReportEntityType.GIG: {
      if (gigs.length === 0) return null;
      const gig = faker.helpers.arrayElement(gigs);
      const reporter = faker.helpers.arrayElement(
        webUsers.filter((u) => u.id !== gig.postedByWebUserId),
      );
      if (!reporter) return null;
      return {
        entityType,
        entityId: gig.id,
        contentSnapshot: `${gig.title}\n\n${gig.description ?? ''}`,
        reporterWebUserId: reporter.id,
      };
    }

    case AbuseReportEntityType.CHAT_MESSAGE: {
      if (messages.length === 0) return null;
      const message = faker.helpers.arrayElement(messages);
      const conversation = conversations.find(
        (c) => c.id === message.conversationId,
      );
      if (!conversation) return null;
      const reporterWebUserId =
        message.senderId === conversation.participantOneId
          ? conversation.participantTwoId
          : conversation.participantOneId;
      return {
        entityType,
        entityId: message.id,
        contentSnapshot: message.body,
        reporterWebUserId,
      };
    }

    case AbuseReportEntityType.CHAT_THREAD: {
      if (conversations.length === 0) return null;
      const conversation = faker.helpers.arrayElement(conversations);
      const transcript = messages
        .filter((m) => m.conversationId === conversation.id)
        .map((m) => `user ${m.senderId}: ${m.body}`)
        .join('\n');
      return {
        entityType,
        entityId: conversation.id,
        contentSnapshot: transcript || '(no messages yet)',
        reporterWebUserId: faker.helpers.arrayElement([
          conversation.participantOneId,
          conversation.participantTwoId,
        ]),
      };
    }
  }
}

export async function seedAbuseReports(
  prisma: PrismaClient,
  webUsers: WebUser[],
  profiles: FreelanceProfile[],
  gigs: Gig[],
  conversations: Conversation[],
  messages: ChatMessage[],
  count: number,
  reviewingAdminId: number,
) {
  console.log(`Seeding ${count} abuse reports...`);

  const reports = [];

  for (let i = 0; i < count; i++) {
    const candidate = buildCandidate(
      webUsers,
      profiles,
      gigs,
      conversations,
      messages,
    );
    if (!candidate) continue;

    const status = faker.helpers.weightedArrayElement([
      { value: AbuseReportStatus.PENDING, weight: 5 },
      { value: AbuseReportStatus.REVIEWED, weight: 3 },
      { value: AbuseReportStatus.DISMISSED, weight: 2 },
    ]);

    const report = await prisma.abuseReport.create({
      data: {
        reporterWebUserId: candidate.reporterWebUserId,
        entityType: candidate.entityType,
        entityId: candidate.entityId,
        category: faker.helpers.arrayElement(CATEGORIES),
        details: faker.datatype.boolean({ probability: 0.6 })
          ? faker.lorem.sentence()
          : null,
        contentSnapshot:
          candidate.contentSnapshot.slice(0, SNAPSHOT_MAX_LENGTH) ||
          '(no content)',
        status,
        ...(status !== AbuseReportStatus.PENDING && {
          reviewedByAdminId: reviewingAdminId,
          reviewedAt: faker.date.recent({ days: 10 }),
          resolutionNotes: faker.datatype.boolean({ probability: 0.5 })
            ? faker.lorem.sentence()
            : null,
        }),
      },
    });

    reports.push(report);
  }

  console.log(`  Seeded ${reports.length} abuse reports`);
  return reports;
}
