import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvolutionService } from './evolution.service';
import { CreateEvolutionDto } from './dto/create-evolution.dto';
import { UpdateEvolutionDto } from './dto/update-evolution.dto';
import { isFeatureEnabled } from '../../config/env.validation';

@Controller('evolution')
export class EvolutionController {
  constructor(
    private readonly evolutionService: EvolutionService,
    private readonly config: ConfigService,
  ) {}

  private ensureFeatureEnabled() {
    const enabled = isFeatureEnabled(
      this.config.get<string>('FEATURE_EVOLUTION_ENABLED'),
      false,
    );
    if (!enabled) {
      throw new ServiceUnavailableException(
        'Feature Evolution desabilitada. Ative FEATURE_EVOLUTION_ENABLED=true para usar os endpoints.',
      );
    }
  }

  @Post()
  create(@Body() createEvolutionDto: CreateEvolutionDto) {
    this.ensureFeatureEnabled();
    return this.evolutionService.create(createEvolutionDto);
  }

  @Get()
  findAll() {
    this.ensureFeatureEnabled();
    return this.evolutionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    this.ensureFeatureEnabled();
    return this.evolutionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEvolutionDto: UpdateEvolutionDto,
  ) {
    this.ensureFeatureEnabled();
    return this.evolutionService.update(+id, updateEvolutionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    this.ensureFeatureEnabled();
    return this.evolutionService.remove(+id);
  }
}
