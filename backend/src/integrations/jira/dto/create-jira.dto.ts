export class CreateJiraDto {
  fields: {
    project: { key: string };
    summary: string;
    description: string;
    issuetype: { name: string };
    labels?: string[];
  };
}

export class CreateJiraBulkDto {
  projectKey: string;
  issues: {
    summary: string;
    description?: string;
  }[];
}

export class ClearIssuesDto {
  projectKey?: string;
  jql?: string;
}
