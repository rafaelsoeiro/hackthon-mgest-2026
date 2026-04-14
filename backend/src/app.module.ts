import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EvolutionModule } from './integrations/evolution/evolution.module';
import { JiraModule } from './integrations/jira/jira.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EvolutionModule,
    JiraModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
