import { PrismaService } from '@/database/prisma.service';
import { WebUserBlocksService } from '@/modules/web-user-blocks/web-user-blocks.service';
import { MailService } from '@/shared/mail/mail.service';
import type { Conversation } from '@careerslk/database';
import { SendMessageInput, StartConversationInput } from '@careerslk/types';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const PARTICIPANT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

@Injectable()
export class WebUserChatService {
  private readonly logger = new Logger(WebUserChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blocks: WebUserBlocksService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private pair(a: number, b: number): { one: number; two: number } {
    return a < b ? { one: a, two: b } : { one: b, two: a };
  }

  private otherParticipantId(
    conversation: Conversation,
    webUserId: number,
  ): number {
    return conversation.participantOneId === webUserId
      ? conversation.participantTwoId
      : conversation.participantOneId;
  }

  private async requireParticipant(
    webUserId: number,
    conversationId: number,
  ): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participantOneId: webUserId }, { participantTwoId: webUserId }],
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async startOrGetConversation(
    currentUserId: number,
    dto: StartConversationInput,
  ) {
    if (dto.otherWebUserId === currentUserId) {
      throw new BadRequestException('You cannot message yourself');
    }
    if (
      await this.blocks.isBlockedEitherDirection(
        currentUserId,
        dto.otherWebUserId,
      )
    ) {
      throw new ForbiddenException(
        'You cannot start a conversation with this user',
      );
    }

    const { one, two } = this.pair(currentUserId, dto.otherWebUserId);

    const existing = await this.prisma.conversation.findUnique({
      where: {
        participantOneId_participantTwoId: {
          participantOneId: one,
          participantTwoId: two,
        },
      },
    });
    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        participantOneId: one,
        participantTwoId: two,
        contextGigId: dto.gigId,
        contextFreelanceProfileId: dto.freelanceProfileId,
      },
    });
  }

  async listConversations(webUserId: number) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ participantOneId: webUserId }, { participantTwoId: webUserId }],
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        participantOne: { select: PARTICIPANT_SELECT },
        participantTwo: { select: PARTICIPANT_SELECT },
        contextGig: { select: { id: true, title: true } },
        contextFreelanceProfile: { select: { id: true, category: true } },
      },
    });
    if (conversations.length === 0) return [];

    const otherIds = conversations.map((c) =>
      this.otherParticipantId(c, webUserId),
    );
    const blocks = await this.prisma.webUserBlock.findMany({
      where: {
        OR: otherIds.flatMap((otherId) => [
          { blockerId: webUserId, blockedId: otherId },
          { blockerId: otherId, blockedId: webUserId },
        ]),
      },
    });
    const blockedPairKeys = new Set(
      blocks.map((b) => [b.blockerId, b.blockedId].sort().join(':')),
    );

    return conversations.map((c) => {
      const otherParticipant =
        c.participantOneId === webUserId ? c.participantTwo : c.participantOne;
      const isReadOnly = blockedPairKeys.has(
        [webUserId, otherParticipant.id].sort().join(':'),
      );
      const contextLabel = c.contextGig
        ? {
            type: 'gig' as const,
            id: c.contextGig.id,
            title: c.contextGig.title,
          }
        : c.contextFreelanceProfile
          ? {
              type: 'freelanceProfile' as const,
              id: c.contextFreelanceProfile.id,
              title: c.contextFreelanceProfile.category ?? 'Freelancer profile',
            }
          : null;

      return { ...c, otherParticipant, isReadOnly, contextLabel };
    });
  }

  async getConversation(webUserId: number, conversationId: number) {
    const conversation = await this.requireParticipant(
      webUserId,
      conversationId,
    );
    const otherId = this.otherParticipantId(conversation, webUserId);
    const [otherParticipant, isReadOnly] = await Promise.all([
      this.prisma.webUser.findUniqueOrThrow({
        where: { id: otherId },
        select: PARTICIPANT_SELECT,
      }),
      this.blocks.isBlockedEitherDirection(webUserId, otherId),
    ]);

    return { ...conversation, otherParticipant, isReadOnly };
  }

  async listMessages(
    webUserId: number,
    conversationId: number,
    opts: { limit?: number; beforeId?: number },
  ) {
    await this.requireParticipant(webUserId, conversationId);
    const limit = Math.min(opts.limit ?? 50, 100);

    return this.prisma.chatMessage.findMany({
      where: {
        conversationId,
        ...(opts.beforeId ? { id: { lt: opts.beforeId } } : {}),
      },
      orderBy: { id: 'desc' },
      take: limit,
      include: { sender: { select: PARTICIPANT_SELECT } },
    });
  }

  async sendMessage(
    webUserId: number,
    conversationId: number,
    dto: SendMessageInput,
  ) {
    const conversation = await this.requireParticipant(
      webUserId,
      conversationId,
    );
    const otherId = this.otherParticipantId(conversation, webUserId);

    if (await this.blocks.isBlockedEitherDirection(webUserId, otherId)) {
      throw new ForbiddenException('This conversation is read-only');
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.chatMessage.create({
        data: { conversationId, senderId: webUserId, body: dto.body },
        include: { sender: { select: PARTICIPANT_SELECT } },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      return created;
    });

    // Best-effort — a missing/broken SMTP config must never fail the
    // message-send request itself.
    try {
      await this.notifyNewMessage(webUserId, otherId, conversationId, dto.body);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to send new-message email for conversation ${conversationId}: ${message}`,
      );
    }

    return message;
  }

  private async notifyNewMessage(
    senderId: number,
    recipientId: number,
    conversationId: number,
    body: string,
  ): Promise<void> {
    const [sender, recipient] = await Promise.all([
      this.prisma.webUser.findUniqueOrThrow({ where: { id: senderId } }),
      this.prisma.webUser.findUniqueOrThrow({ where: { id: recipientId } }),
    ]);

    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    await this.mail.sendNewMessageEmail(
      recipient.email,
      recipient.firstName ?? 'there',
      sender.firstName ?? 'A careers.lk user',
      body,
      `${frontendUrl}/freelance/messages/${conversationId}`,
    );
  }
}
