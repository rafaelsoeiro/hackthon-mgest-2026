import { Injectable } from '@nestjs/common';
import { CreateEvolutionDto } from './dto/create-evolution.dto';
import { UpdateEvolutionDto } from './dto/update-evolution.dto';

@Injectable()
export class EvolutionService {
  create(createEvolutionDto: CreateEvolutionDto) {
    return 'This action adds a new evolution';
  }

  findAll() {
    return `This action returns all evolution`;
  }

  findOne(id: number) {
    return `This action returns a #${id} evolution`;
  }

  update(id: number, updateEvolutionDto: UpdateEvolutionDto) {
    return `This action updates a #${id} evolution`;
  }

  remove(id: number) {
    return `This action removes a #${id} evolution`;
  }
}
