import { Injectable } from '@nestjs/common';
import { JiraClient } from './jira.client';
import { ClearIssuesDto, CreateJiraBulkDto, CreateJiraDto } from './dto/create-jira.dto';
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

  async clearIssues(input: ClearIssuesDto) {
    const jql =
      input.jql?.trim() ||
      (input.projectKey ? `project = ${input.projectKey}` : '');

    if (!jql) {
      throw new Error('Informe projectKey ou jql para limpar as issues.');
    }

    const batchSize = 50;
    let startAt = 0;
    let totalDeleted = 0;

    while (true) {
      const keys = await this.jiraClient.searchIssueKeys(jql, {
        startAt,
        maxResults: batchSize,
      });

      if (!keys.length) break;

      for (const key of keys) {
        await this.jiraClient.deleteIssue(key);
        totalDeleted += 1;
      }

      startAt += batchSize;
    }

    return { deleted: totalDeleted };
  }

  async cleanupMockIssues(label?: string): Promise<{ deleted: number }> {
    const baseJql =
      label && label.trim()
        ? `labels = \"${label.trim()}\"`
        : 'labels = \"mock\" OR labels ~ \"test-run-\"';

    const batchSize = 50;
    let startAt = 0;
    let totalDeleted = 0;

    while (true) {
      const keys = await this.jiraClient.searchIssueKeys(baseJql, {
        startAt,
        maxResults: batchSize,
      });

      if (!keys.length) break;

      for (let i = 0; i < keys.length; i += batchSize) {
        const chunk = keys.slice(i, i + batchSize);
        await Promise.all(chunk.map((key) => this.jiraClient.deleteIssue(key)));
        totalDeleted += chunk.length;
      }

      startAt += batchSize;
    }

    return { deleted: totalDeleted };
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
