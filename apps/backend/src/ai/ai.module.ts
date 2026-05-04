import { Module } from '@nestjs/common';
import { AIAnalysisService } from './ai-analysis.service.js';
import { EmbeddingService } from './embedding.service.js';

@Module({
  providers: [AIAnalysisService, EmbeddingService],
  exports: [AIAnalysisService, EmbeddingService],
})
export class AIModule {}
