import { Controller, Get, Query } from '@nestjs/common';
import { FeedbacksService } from './feedbacks.service';

@Controller('feedbacks')
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @Get()
  findAll(
    @Query('system') system?: string,
    @Query('clusterId') clusterId?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.feedbacksService.findAll({
      system,
      clusterId,
      limit: limit ? +limit : undefined,
      page: page ? +page : undefined,
    });
  }
}
