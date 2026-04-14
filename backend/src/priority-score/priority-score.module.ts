import { Module } from '@nestjs/common';
import { PriorityScoreService } from './priority-score.service.js';

@Module({
  providers: [PriorityScoreService],
  exports: [PriorityScoreService],
})
export class PriorityScoreModule {}
