import { Controller, Get, Post, Body, Param, Delete, Query, Put } from '@nestjs/common';
import { JiraService } from './jira.service';
import { ClearIssuesDto, CreateJiraBulkDto, CreateJiraDto } from './dto/create-jira.dto';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Controller('jira')
export class JiraController {
  constructor(private readonly jiraService: JiraService) {}

  @Get('myself')
  async atlassianMySelf() {
    return this.jiraService.atlassianMySelf();
  }

  @Post('issues')
  async createIssue(@Body() createJiraDto: CreateJiraDto) {
    return this.jiraService.createIssue(createJiraDto);
  }

  @Post('issues/bulk')
  async createIssuesBulk(@Body() input: CreateJiraBulkDto) {
    return this.jiraService.createIssuesBulk(input);
  }

  @Post('issues/clear')
  async clearIssues(@Body() input: ClearIssuesDto) {
    return this.jiraService.clearIssues(input);
  }

  @Delete('issues/cleanup')
  async cleanupMockIssues(@Query('label') label?: string) {
    return this.jiraService.cleanupMockIssues(label);
  }

  @Get('issues/:key')
  async getIssue(@Param('key') key: string) {
    return this.jiraService.getIssue(key);
  }

  @Get('issues')
  async searchIssues(
    @Query('jql') jql: string,
    @Query('startAt') startAt?: string,
    @Query('maxResults') maxResults?: string,
  ) {
    return this.jiraService.searchIssues(jql, {
      startAt: startAt ? Number(startAt) : undefined,
      maxResults: maxResults ? Number(maxResults) : undefined,
    });
  }

  @Post('projects')
  async createProject(@Body() input: CreateProjectDto) {
    return this.jiraService.createProject(input);
  }

  @Get('projects')
  async getAllProjects() {
    return this.jiraService.getAllProjects();
  }

  @Get('projects/:key')
  async getProject(@Param('key') key: string) {
    return this.jiraService.getProject(key);
  }

  @Put('projects/:key')
  async updateProject(@Param('key') key: string, @Body() input: UpdateProjectDto) {
    return this.jiraService.updateProject(key, input);
  }

  @Delete('projects/:key')
  async deleteProject(@Param('key') key: string) {
    return this.jiraService.deleteProject(key);
  }
}
