import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppWebhookDto } from './dto/whatsapp-webhook.dto';
import { FeedbackChannel, SystemCode } from '@prisma/client';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('wa-ingestion') private readonly waQueue: Queue,
  ) {}

  async handleWebhook(dto: WhatsAppWebhookDto): Promise<{ status: string }> {
    const { event, data } = dto;

    // ─── Filtro 1: só aceita messages.upsert ──
    if (event !== 'messages.upsert') {
      throw new UnprocessableEntityException(
        `Event "${event}" is not supported. Only "messages.upsert" is accepted.`,
      );
    }

    // ─── Filtro 2: só aceita mensagens de grupo (@g.us) ──
    const remoteJid = data.key.remoteJid;
    if (!remoteJid.endsWith('@g.us')) {
      throw new UnprocessableEntityException('Only group messages are accepted.');
    }

    const groupId = remoteJid.replace('@g.us', '');

    // ─── Filtro 3: grupo deve estar monitorado ──
    const group = await this.prisma.whatsAppGroup.findUnique({
      where: { groupId },
    });

    if (!group || !group.isMonitored) {
      throw new UnprocessableEntityException(
        `Group "${groupId}" is not monitored.`,
      );
    }

    // ─── Filtro 4: ignorar mensagens do bot ──
    if (data.key.fromMe) {
      throw new UnprocessableEntityException('Bot messages are ignored.');
    }

    // ─── Extrair conteúdo textual ──
    const rawContent =
      data.message?.conversation ||
      data.message?.extendedTextMessage?.text ||
      '';

    if (!rawContent.trim()) {
      throw new UnprocessableEntityException('Message has no text content.');
    }

    const externalId = data.key.id;

    // ─── Filtro 5: idempotência por externalId ──
    const existing = await this.prisma.rawFeedback.findFirst({
      where: { externalId, channel: FeedbackChannel.WHATSAPP },
      select: { id: true },
    });

    if (existing) {
      this.logger.debug(`Duplicate message ignored: externalId=${externalId}`);
      return { status: 'duplicate' };
    }

    // ─── Determinar receivedAt e nightWindow ──
    const receivedAt = new Date(data.messageTimestamp * 1000);
    const hour = receivedAt.getUTCHours();
    const isNightWindow = hour >= 0 && hour < 5;

    // ─── Regra de negócio: systemHint baseado no nome do grupo ──
    const groupName = group.groupName || '';
    const nameUpper = groupName.toUpperCase();
    if (
      (nameUpper.includes('CD') || nameUpper.includes('LOGÍSTICA') || nameUpper.includes('LOGISTICA')) &&
      group.systemHint !== SystemCode.GM_LOG
    ) {
      await this.prisma.whatsAppGroup.update({
        where: { id: group.id },
        data: { systemHint: SystemCode.GM_LOG },
      });
      this.logger.log(
        `WhatsAppGroup "${groupName}" systemHint updated to GM_LOG`,
      );
    }

    // ─── Criar RawFeedback ──
    const authorId = data.key.participant || remoteJid;
    const authorName = data.pushName || null;

    const rawFeedback = await this.prisma.rawFeedback.create({
      data: {
        channel: FeedbackChannel.WHATSAPP,
        externalId,
        sourceGroupId: groupId,
        sourceGroupName: group.groupName,
        authorId,
        authorName,
        rawContent,
        receivedAt,
        processingStatus: 'PENDING',
        attachments: isNightWindow ? { nightWindow: true } : undefined,
      },
    });

    this.logger.log(
      `RawFeedback created: id=${rawFeedback.id} group=${groupId} externalId=${externalId}`,
    );

    // ─── Enfileirar job no BullMQ ──
    await this.waQueue.add('process-whatsapp', {
      rawFeedbackId: rawFeedback.id,
    });

    return { status: 'accepted' };
  }
}
