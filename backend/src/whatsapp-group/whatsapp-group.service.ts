import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWhatsAppGroupDto } from './dto/update-whatsapp-group.dto';
import axios from 'axios';

@Injectable()
export class WhatsAppGroupService implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppGroupService.name);
  private readonly evolutionApiUrl: string;
  private readonly evolutionApiKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.evolutionApiUrl = this.config.get<string>('EVOLUTION_API_URL')!;
    this.evolutionApiKey = this.config.get<string>('EVOLUTION_API_KEY')!;
  }

  async onModuleInit() {
    this.logger.log('Syncing WhatsApp groups from Evolution API on startup...');
    try {
      await this.syncGroupsFromEvolutionAPI();
    } catch (err) {
      this.logger.error(`Failed to sync WhatsApp groups on startup: ${err}`);
    }
  }

  /**
   * Fetch all groups from Evolution API and upsert into WhatsAppGroup.
   * New groups enter with isMonitored=false.
   */
  async syncGroupsFromEvolutionAPI(): Promise<{
    total: number;
    created: number;
    updated: number;
  }> {
    const instance = 'default'; // Evolution API instance name
    const url = `${this.evolutionApiUrl}/group/fetchAllGroups/${instance}`;

    this.logger.log(`Fetching groups from: ${url}`);

    const { data } = await axios.get(url, {
      headers: {
        apikey: this.evolutionApiKey,
      },
    });

    // Evolution API returns an array of groups
    const groups: Array<{
      id: string;
      subject: string;
      size?: number;
    }> = Array.isArray(data) ? data : [];

    this.logger.log(`Fetched ${groups.length} groups from Evolution API`);

    let created = 0;
    let updated = 0;

    for (const group of groups) {
      // groupId from Evolution: "120363xxxx@g.us" → extract numeric part
      const groupId = group.id?.replace('@g.us', '') || group.id;
      const groupName = group.subject || 'Unknown';
      const memberCount = group.size || null;

      const existing = await this.prisma.whatsAppGroup.findUnique({
        where: { groupId },
      });

      if (existing) {
        await this.prisma.whatsAppGroup.update({
          where: { groupId },
          data: {
            groupName,
            memberCount,
          },
        });
        updated++;
      } else {
        await this.prisma.whatsAppGroup.create({
          data: {
            groupId,
            groupName,
            memberCount,
            isMonitored: false,
          },
        });
        created++;
      }
    }

    const summary = { total: groups.length, created, updated };
    this.logger.log(`WhatsApp groups sync: ${JSON.stringify(summary)}`);
    return summary;
  }

  /**
   * List all WhatsApp groups.
   */
  async findAll() {
    return this.prisma.whatsAppGroup.findMany({
      orderBy: { groupName: 'asc' },
    });
  }

  /**
   * Get a single WhatsApp group by id.
   */
  async findOne(id: string) {
    const group = await this.prisma.whatsAppGroup.findUnique({
      where: { id },
    });
    if (!group) {
      throw new NotFoundException(`WhatsApp group "${id}" not found`);
    }
    return group;
  }

  /**
   * Update isMonitored and/or systemHint for a group.
   */
  async update(id: string, dto: UpdateWhatsAppGroupDto) {
    // Ensure group exists
    await this.findOne(id);

    return this.prisma.whatsAppGroup.update({
      where: { id },
      data: dto,
    });
  }
}
