import { Module } from '@nestjs/common';
import { ConfigRulesController } from './config-rules.controller';
import { ConfigRulesService } from './config-rules.service';
import { PriorityScoreModule } from '../priority-score/priority-score.module';

@Module({
  imports: [PriorityScoreModule],
  controllers: [ConfigRulesController],
  providers: [ConfigRulesService],
})
export class ConfigRulesModule {}
