import { Injectable } from '@nestjs/common';
import { JiraClient } from './jira.client';
import { CreateJiraBulkDto, CreateJiraDto } from './dto/create-jira.dto';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class JiraService {
  constructor(private readonly jiraClient: JiraClient) {}

  async atlassianMySelf() {
    return this.jiraClient.getCurrentUser();
  }

  async createIssue(input: CreateJiraDto) {
    return this.jiraClient.createIssue(input);
  }

  async createIssuesBulk(input: CreateJiraBulkDto) {
    return this.jiraClient.createIssuesBulk(input.projectKey, input.issues);
  }

  async searchIssues(jql: string, options?: { startAt?: number; maxResults?: number }) {
    return this.jiraClient.searchIssues(jql, options);
  }

  async getIssue(issueKey: string) {
    return this.jiraClient.getIssue(issueKey);
  }

  async createProject(input: CreateProjectDto) {
    return this.jiraClient.createProject(input);
  }

  async getAllProjects() {
    return this.jiraClient.getAllProjects();
  }

  async getProject(projectKey: string) {
    return this.jiraClient.getProject(projectKey);
  }

  async updateProject(projectKey: string, data: UpdateProjectDto) {
    return this.jiraClient.updateProject(projectKey, data);
  }

  async deleteProject(projectKey: string) {
    return this.jiraClient.deleteProject(projectKey);
  }

}
