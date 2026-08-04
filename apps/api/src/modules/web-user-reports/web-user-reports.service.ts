import { PrismaService } from '@/database/prisma.service';
import {
  AbuseReportEntityType,
  AbuseReportStatus,
  FileReportInput,
} from '@careerslk/types';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

const SNAPSHOT_MAX_LENGTH = 2000;
const THREAD_SNAPSHOT_MESSAGE_COUNT = 20;

function truncate(text: string): string {
  return text.length > SNAPSHOT_MAX_LENGTH
    ? `${text.slice(0, SNAPSHOT_MAX_LENGTH)}…`
    : text;
}

@Injectable()
export class WebUserReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveContentSnapshot(
    reporterWebUserId: number,
    entityType: FileReportInput['entityType'],
    entityId: number,
  ): Promise<string> {
    switch (entityType) {
      case AbuseReportEntityType.FREELANCE_PROFILE: {
        const profile = await this.prisma.freelanceProfile.findFirst({
          where: { id: entityId, deletedAt: null },
        });
        if (!profile)
          throw new NotFoundException('Freelance profile not found');
        return truncate(profile.bio ?? '');
      }

      case AbuseReportEntityType.GIG: {
        const gig = await this.prisma.gig.findFirst({
          where: { id: entityId, deletedAt: null },
        });
        if (!gig) throw new NotFoundException('Gig not found');
        return truncate(`${gig.title}\n\n${gig.description ?? ''}`);
      }

      case AbuseReportEntityType.CHAT_MESSAGE: {
        const message = await this.prisma.chatMessage.findUnique({
          where: { id: entityId },
          include: { conversation: true },
        });
        if (!message) throw new NotFoundException('Message not found');
        this.assertParticipant(reporterWebUserId, message.conversation);
        return truncate(message.body);
      }

      case AbuseReportEntityType.CHAT_THREAD: {
        const conversation = await this.prisma.conversation.findUnique({
          where: { id: entityId },
        });
        if (!conversation)
          throw new NotFoundException('Conversation not found');
        this.assertParticipant(reporterWebUserId, conversation);

        const messages = await this.prisma.chatMessage.findMany({
          where: { conversationId: entityId },
          orderBy: { id: 'desc' },
          take: THREAD_SNAPSHOT_MESSAGE_COUNT,
          include: { sender: { select: { firstName: true, lastName: true } } },
        });
        const transcript = messages
          .reverse()
          .map((m) => {
            const name =
              [m.sender.firstName, m.sender.lastName]
                .filter(Boolean)
                .join(' ') || 'User';
            return `${name}: ${m.body}`;
          })
          .join('\n');
        return truncate(transcript);
      }
    }
  }

  private assertParticipant(
    webUserId: number,
    conversation: { participantOneId: number; participantTwoId: number },
  ): void {
    if (
      conversation.participantOneId !== webUserId &&
      conversation.participantTwoId !== webUserId
    ) {
      throw new ForbiddenException(
        'You can only report a conversation you are part of',
      );
    }
  }

  async file(webUserId: number, dto: FileReportInput) {
    const contentSnapshot = await this.resolveContentSnapshot(
      webUserId,
      dto.entityType,
      dto.entityId,
    );

    return this.prisma.abuseReport.create({
      data: {
        reporterWebUserId: webUserId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        category: dto.category,
        details: dto.details,
        contentSnapshot,
        status: AbuseReportStatus.PENDING,
      },
    });
  }
}
