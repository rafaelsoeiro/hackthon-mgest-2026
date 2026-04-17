import { Module } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppWebhookGuard } from './guards/whatsapp-webhook.guard';
import { QueueModule } from '../queue/queue.module.js';

@Module({
  imports: [QueueModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WhatsAppWebhookGuard],
})
export class WhatsAppModule {}
