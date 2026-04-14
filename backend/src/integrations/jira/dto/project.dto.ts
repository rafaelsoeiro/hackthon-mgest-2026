export class CreateProjectDto {
  key: string;
  name: string;
  projectTypeKey: string;
  projectTemplateKey: string;
  leadAccountId: string;
}

export class UpdateProjectDto {
  key?: string;
  name?: string;
  projectTypeKey?: string;
  projectTemplateKey?: string;
  leadAccountId?: string;
}
