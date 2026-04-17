import { Module } from '@nestjs/common';
import { WhatsAppGroupService } from './whatsapp-group.service';
import { WhatsAppGroupController } from './whatsapp-group.controller';

@Module({
  controllers: [WhatsAppGroupController],
  providers: [WhatsAppGroupService],
  exports: [WhatsAppGroupService],
})
export class WhatsAppGroupModule {}
