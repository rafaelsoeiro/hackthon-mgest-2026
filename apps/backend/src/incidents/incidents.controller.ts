import { Controller, Get, Param, Patch, Body, Query } from '@nestjs/common';
import { IncidentsService } from './incidents.service';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  findAll(
    @Query('system') system?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.incidentsService.findAll({
      system,
      status,
      sort,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @Get('problems')
  findProblems() {
    return this.incidentsService.findProblems();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id/override')
  applyOverride(
    @Param('id') id: string,
    @Body() body: { priorityLevel: string; reason: string; adjustedBy: string },
  ) {
    return this.incidentsService.applyOverride(id, body);
  }
}
