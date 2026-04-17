import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppWebhookDto } from './dto/whatsapp-webhook.dto';
import { WhatsAppWebhookGuard } from './guards/whatsapp-webhook.guard';

@Controller('api/v1/webhooks/whatsapp')
@UseGuards(WhatsAppWebhookGuard)
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handleWebhook(@Body() dto: WhatsAppWebhookDto) {
    return this.whatsAppService.handleWebhook(dto);
  }
}
