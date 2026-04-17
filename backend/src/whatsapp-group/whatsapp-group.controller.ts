import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WhatsAppGroupService } from './whatsapp-group.service';
import { UpdateWhatsAppGroupDto } from './dto/update-whatsapp-group.dto';

@Controller('api/v1/config/whatsapp-groups')
export class WhatsAppGroupController {
  constructor(private readonly service: WhatsAppGroupService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWhatsAppGroupDto,
  ) {
    return this.service.update(id, dto);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncGroups() {
    return this.service.syncGroupsFromEvolutionAPI();
  }
}
