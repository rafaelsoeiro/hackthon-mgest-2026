import axios, { AxiosInstance } from 'axios';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isFeatureEnabled } from '../../config/env.validation';

type JiraIssue = {
  key?: string;
  fields?: {
    summary?: string;
    status?: { name?: string };
    created?: string;
    updated?: string;
  };
};

type AtlassianDoc = {
  type: 'doc';
  version: 1;
  content: {
    type: 'paragraph';
    content: { type: 'text'; text: string }[];
  }[];
};

type JiraProject = {
  id?: string;
  key?: string;
  name?: string;
  projectTypeKey?: string;
  projectType?: string;
};

type SimplifiedIssue = {
  key: string;
  summary: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type SimplifiedProject = {
  id: string;
  key: string;
  name: string;
  type: string;
};

type CreateIssueInput = {
  fields: {
    project: { key: string };
    summary: string;
    description?: string | AtlassianDoc;
    issuetype: { name: string };
    labels?: string[];
  };
};

type BulkIssueInput = {
  summary: string;
  description?: string;
};

type CreateProjectInput = {
  key: string;
  name: string;
  projectTypeKey: string;
  projectTemplateKey: string;
  leadAccountId: string;
};

type UpdateProjectInput = Partial<{
  key: string;
  name: string;
  projectTypeKey: string;
  projectTemplateKey: string;
  leadAccountId: string;
}>;

type SearchOptions = {
  startAt?: number;
  maxResults?: number;
};

type JiraUser = {
  accountId?: string;
  displayName?: string;
  active?: boolean;
  emailAddress?: string;
};

@Injectable()
export class JiraClient {
  private readonly client: AxiosInstance | null;
  private readonly featureEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.featureEnabled = isFeatureEnabled(
      this.configService.get<string>('FEATURE_JIRA_ENABLED'),
      true,
    );

    if (!this.featureEnabled) {
      this.client = null;
      return;
    }

    const baseUrl = this.configService.get<string>('JIRA_BASE_URL');
    const email = this.configService.get<string>('JIRA_EMAIL');
    const token = this.configService.get<string>('JIRA_API_TOKEN');

    if (!baseUrl || !email || !token) {
      this.client = null;
      return;
    }

    const basicAuth = Buffer.from(`${email}:${token}`).toString('base64');

    this.client = axios.create({
      baseURL: `${baseUrl}/rest/api/3`,
      headers: {
        Authorization: `Basic ${basicAuth}`,
        Accept: 'application/json',
      },
    });
  }

  async getCurrentUser(): Promise<JiraUser> {
    const client = this.getClient();
    try {
      const { data } = await client.get<JiraUser>('/myself');
      return {
        accountId: data.accountId,
        displayName: data.displayName,
        active: data.active,
        emailAddress: data.emailAddress,
      };
    } catch (error) {
      this.handleError(error, 'getCurrentUser');
    }
  }

  async createIssue(
    input: CreateIssueInput,
  ): Promise<{ id?: string; key?: string }> {
    const client = this.getClient();
    try {
      const payload = {
        ...input,
        fields: {
          ...input.fields,
          description:
            typeof input.fields.description === 'string'
              ? this.toAdf(input.fields.description)
              : input.fields.description,
        },
      };
      const { data } = await client.post<{ id?: string; key?: string }>(
        '/issue',
        payload,
      );
      return { id: data.id, key: data.key };
    } catch (error) {
      this.handleError(error, 'createIssue');
    }
  }

  async searchIssues(
    jql: string,
    options: SearchOptions = {},
  ): Promise<SimplifiedIssue[]> {
    const client = this.getClient();
    try {
      const { data } = await client.get<{ issues?: JiraIssue[] }>(
        '/search/jql',
        {
          params: {
            jql,
            ...options,
            fields: 'summary,status,created,updated',
          },
        },
      );
      const issues = data.issues ?? [];
      return issues.map((issue) => this.mapIssue(issue));
    } catch (error) {
      this.handleError(error, 'searchIssues');
    }
  }

  async searchIssueKeys(
    jql: string,
    options: SearchOptions = {},
  ): Promise<string[]> {
    const client = this.getClient();
    try {
      const { data } = await client.get<{ issues?: JiraIssue[] }>(
        '/search/jql',
        {
          params: {
            jql,
            ...options,
            fields: 'summary',
          },
        },
      );
      const issues = data.issues ?? [];
      return issues
        .map((issue) => issue.key)
        .filter((key): key is string => Boolean(key));
    } catch (error) {
      this.handleError(error, 'searchIssueKeys');
    }
  }

  async getIssue(issueKey: string): Promise<SimplifiedIssue> {
    const client = this.getClient();
    try {
      const { data } = await client.get<JiraIssue>(`/issue/${issueKey}`);
      return this.mapIssue(data);
    } catch (error) {
      this.handleError(error, 'getIssue');
    }
  }

  async deleteIssue(issueKey: string): Promise<void> {
    const client = this.getClient();
    try {
      await client.delete(`/issue/${issueKey}`);
    } catch (error) {
      this.handleError(error, 'deleteIssue');
    }
  }

  async createIssuesBulk(
    projectKey: string,
    issues: BulkIssueInput[],
  ): Promise<string[]> {
    const client = this.getClient();
    const batchSize = 50;
    const createdKeys: string[] = [];

    for (let i = 0; i < issues.length; i += batchSize) {
      const batch = issues.slice(i, i + batchSize);
      const payload = {
        issueUpdates: batch.map((issue) => ({
          fields: {
            project: { key: projectKey },
            summary: issue.summary,
            description: issue.description
              ? this.toAdf(issue.description)
              : undefined,
            issuetype: { name: 'Task' },
          },
        })),
      };

      try {
        const { data } = await client.post<{
          issues?: { key?: string }[];
        }>('/issue/bulk', payload);

        const keys = (data.issues ?? [])
          .map((item) => item.key)
          .filter((key): key is string => Boolean(key));
        createdKeys.push(...keys);
      } catch (error) {
        this.handleError(error, 'createIssuesBulk');
      }
    }

    return createdKeys;
  }

  async createProject(input: CreateProjectInput): Promise<SimplifiedProject> {
    const client = this.getClient();
    try {
      const { data } = await client.post<JiraProject>('/project', input);
      const createdKey = data.key ?? input.key;
      const { data: full } = await client.get<JiraProject>(
        `/project/${createdKey}`,
      );
      return this.mapProject(full);
    } catch (error) {
      this.handleError(error, 'createProject');
    }
  }

  async getAllProjects(): Promise<SimplifiedProject[]> {
    const client = this.getClient();
    try {
      const { data } = await client.get<{ values?: JiraProject[] }>(
        '/project/search',
      );
      const projects = data.values ?? [];
      return projects.map((project) => this.mapProject(project));
    } catch (error) {
      this.handleError(error, 'getAllProjects');
    }
  }

  async getProject(projectKey: string): Promise<SimplifiedProject> {
    const client = this.getClient();
    try {
      const { data } = await client.get<JiraProject>(
        `/project/${projectKey}`,
      );
      return this.mapProject(data);
    } catch (error) {
      this.handleError(error, 'getProject');
    }
  }

  async updateProject(
    projectKey: string,
    data: UpdateProjectInput,
  ): Promise<SimplifiedProject> {
    const client = this.getClient();
    try {
      const { data: updated } = await client.put<JiraProject>(
        `/project/${projectKey}`,
        data,
      );
      return this.mapProject(updated);
    } catch (error) {
      this.handleError(error, 'updateProject');
    }
  }

  async deleteProject(projectKey: string): Promise<{ deleted: true }> {
    const client = this.getClient();
    try {
      await client.delete(`/project/${projectKey}`);
      return { deleted: true };
    } catch (error) {
      this.handleError(error, 'deleteProject');
    }
  }

  private mapIssue(issue: JiraIssue): SimplifiedIssue {
    return {
      key: issue.key ?? '',
      summary: issue.fields?.summary ?? '',
      status: issue.fields?.status?.name ?? '',
      createdAt: issue.fields?.created ?? '',
      updatedAt: issue.fields?.updated ?? '',
    };
  }

  private mapProject(project: JiraProject): SimplifiedProject {
    return {
      id: project.id ?? '',
      key: project.key ?? '',
      name: project.name ?? '',
      type: project.projectTypeKey ?? project.projectType ?? '',
    };
  }

  private toAdf(text: string): AtlassianDoc {
    return {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text }],
        },
      ],
    };
  }

  private handleError(error: unknown, context: string): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;
      console.error(`[JiraClient] ${context} failed`, { status, data });
      throw new Error(`Falha ao comunicar com o Jira (${context}).`);
    }

    console.error(`[JiraClient] ${context} failed`, error);
    throw new Error(`Falha ao comunicar com o Jira (${context}).`);
  }

  private getClient(): AxiosInstance {
    if (!this.featureEnabled) {
      throw new ServiceUnavailableException(
        'Feature Jira desabilitada. Defina FEATURE_JIRA_ENABLED=true para usar endpoints de Jira.',
      );
    }
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Jira habilitado, mas configuração incompleta. Verifique JIRA_BASE_URL, JIRA_EMAIL e JIRA_API_TOKEN.',
      );
    }
    return this.client;
  }
}
