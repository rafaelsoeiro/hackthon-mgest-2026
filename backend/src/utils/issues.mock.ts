import { JiraClient } from '../integrations/jira/jira.client';

type MockIssue = {
  summary: string;
  description?: string;
};

// Dados de exemplo seguindo a referencia do Jira Cloud (campos e estilo de descricao),
// adaptados ao schema simplificado do nosso endpoint bulk.
export const mockIssues: MockIssue[] = [
  {
    summary: 'Login falha com credenciais validas',
    description:
      'Usuario relata erro 401 ao tentar acessar o sistema com credenciais corretas.',
  },
  {
    summary: 'Sistema retorna 500 ao abrir painel',
    description:
      'Ao acessar /dashboard, a tela fica em branco e o backend responde 500.',
  },
  {
    summary: 'Pedido permanece em status "pendente"',
    description:
      'Fluxo principal travado: pedido aprovado nao avanca para processamento.',
  },
  {
    summary: 'Integracao externa timeout intermitente',
    description:
      'Falha de rede ao integrar com provedor; ocorrencia a cada ~10 minutos.',
  },
  {
    summary: 'Erro ao anexar arquivo no ticket',
    description:
      'Upload de PDF falha com mensagem "Network Error" no frontend.',
  },
  {
    summary: 'Email de confirmacao nao enviado',
    description:
      'Usuarios nao recebem email de confirmacao após cadastro.',
  },
  {
    summary: 'Pesquisa retorna resultados incompletos',
    description:
      'Busca por cliente nao retorna todos os registros esperados.',
  },
  {
    summary: 'Pagamento recusado indevidamente',
    description:
      'Cartao aprovado pela operadora mas app retorna "pagamento recusado".',
  },
  {
    summary: 'Erro de permissao ao acessar relatorio',
    description:
      'Usuarios com perfil de gerente recebem 403 ao abrir relatorio mensal.',
  },
  {
    summary: 'Fila de processamento travada',
    description:
      'Jobs ficam em estado "running" por tempo indefinido.',
  },
  {
    summary: 'Notificacoes push nao chegam no Android',
    description:
      'Push funciona no iOS, mas Android nao recebe nenhuma notificacao.',
  },
  {
    summary: 'Performance lenta no horario de pico',
    description:
      'Endpoint /orders leva mais de 8s entre 10h e 12h.',
  },
  {
    summary: 'Erro ao exportar CSV',
    description:
      'Exportacao falha ao atingir ~5k linhas; arquivo corrompido.',
  },
  {
    summary: 'Usuario reclama de cobranca duplicada',
    description:
      'Sistema gerou duas cobrancas para a mesma ordem.',
  },
  {
    summary: 'Falha na atualizacao de estoque',
    description:
      'Quantidade nao é atualizada apos venda confirmada.',
  },
  {
    summary: 'Webhook nao dispara para evento de cancelamento',
    description:
      'Cliente externo nao recebe evento "order.cancelled".',
  },
  {
    summary: 'Erro ao redefinir senha',
    description:
      'Link de redefinicao retorna "token invalido" imediatamente.',
  },
  {
    summary: 'Formularios nao salvam no Safari',
    description:
      'Usuarios do Safari perdem dados ao tentar salvar o formulario.',
  },
  {
    summary: 'Sistema nao registra logs de auditoria',
    description:
      'Acoes criticas nao aparecem no historico de auditoria.',
  },
  {
    summary: 'Erro 502 no gateway',
    description:
      'Ocorrencias esporadicas de 502 entre servicos internos.',
  },
];

export async function seedMockIssues(
  jiraClient: JiraClient,
  projectKey: string,
) {
  return jiraClient.createIssuesBulk(projectKey, mockIssues);
}
