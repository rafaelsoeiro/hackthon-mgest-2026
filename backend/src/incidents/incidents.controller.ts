import { Controller, Get, Param, Patch, Body, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
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

  @Get(':id/export')
  async exportIncident(@Param('id') id: string, @Res() res: Response) {
    const data = await this.incidentsService.exportIncident(id);
    const filename = `incident-${id}-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(data);
  }

  @Patch(':id/override')
  applyOverride(
    @Param('id') id: string,
    @Body() body: { priorityLevel: string; reason: string; adjustedBy: string },
  ) {
    return this.incidentsService.applyOverride(id, body);
  }

  @Patch(':id/priority')
  updatePriority(
    @Param('id') id: string,
    @Body() body: { priorityLevel: string; reason: string },
  ) {
    return this.incidentsService.updatePriority(id, body);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.incidentsService.updateStatus(id, body);
  }
}
