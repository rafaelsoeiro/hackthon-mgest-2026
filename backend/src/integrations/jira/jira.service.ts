import { HttpException, Injectable } from '@nestjs/common';
import { CreateJiraDto } from './dto/create-jira.dto';
import { UpdateJiraDto } from './dto/update-jira.dto';

@Injectable()
export class JiraService {

  async atlassianMySelf() {
    if (!process.env.ATLASSIAN_BASE_URL) {
      throw new HttpException(
        {
          code: 'CONFIGURACAO_INCOMPLETA',
          message: 'ATLASSIAN_BASE_URL nao configurada.',
        },
        500,
      );
    }
    if (!process.env.ATLASSIAN_EMAIL) {
      throw new HttpException(
        {
          code: 'CONFIGURACAO_INCOMPLETA',
          message: 'ATLASSIAN_EMAIL nao configurada.',
        },
        500,
      );
    }
    if (!process.env.ATLASSIAN_API_TOKEN) {
      throw new HttpException(
        {
          code: 'CONFIGURACAO_INCOMPLETA',
          message: 'ATLASSIAN_API_TOKEN nao configurada.',
        },
        500,
      );
    }

    const basicAuth = Buffer.from(
      `${process.env.ATLASSIAN_EMAIL}:${process.env.ATLASSIAN_API_TOKEN}`,
    ).toString('base64');

    const response = await fetch(
      `${process.env.ATLASSIAN_BASE_URL}/rest/api/3/myself`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          Accept: 'application/json',
        },
      },
    );

    if (!response.ok) {
      const body = await response.text();
      const details =
        body?.trim() ||
        `Falha na requisicao: ${response.status} ${response.statusText}`;
      throw new HttpException(
        {
          code: 'JIRA_REQUISICAO_FALHOU',
          status: response.status,
          message: 'Falha ao comunicar com o Jira.',
          detalhes: details,
        },
        response.status,
      );
    }

    return response.json();
  }

  create(createJiraDto: CreateJiraDto) {
    return 'This action adds a new jira';
  }

  findAll() {
    return `This action returns all jira`;
  }

  findOne(id: number) {
    return `This action returns a #${id} jira`;
  }

  update(id: number, updateJiraDto: UpdateJiraDto) {
    return `This action updates a #${id} jira`;
  }

  remove(id: number) {
    return `This action removes a #${id} jira`;
  }
}
