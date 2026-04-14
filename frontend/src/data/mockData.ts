export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type Source = 'WHATSAPP' | 'JIRA';
export type SystemCode =
  'GM_CORE' | 'GM_SUITE' | 'FINANCEIRO' | 'LOGISTICA_CD' | 'INFRA' | 'OUTRO';

export interface IncidentCluster {
  id: string;
  title: string;
  systemCode: SystemCode;
  categoryL1: string; categoryL2: string; categoryL3: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  aggregatePriorityScore: number;
  priorityLevel: PriorityLevel;
  feedbackCount: number;
  uniqueGroupCount: number;
  scoreS: number; scoreV: number; scoreR: number; scoreT: number; scoreK: number;
  overrideApplied: boolean;
  firstSeenAt: string; lastSeenAt: string;
  summary: string;
  sources: Source[];
  jiraUrl: string | null;
  jiraKey: string | null;
}

export const mockClusters: IncidentCluster[] = [
  {
    id: 'cl-001',
    title: 'Falha na rotina de carga noturna — preços não atualizados',
    systemCode: 'GM_CORE', categoryL1: 'ERP Proprietário',
    categoryL2: 'GM Core', categoryL3: 'Falha de Rotina/Batch',
    status: 'OPEN', aggregatePriorityScore: 93, priorityLevel: 'CRITICAL',
    feedbackCount: 14, uniqueGroupCount: 4,
    scoreS: 9.5, scoreV: 9.0, scoreR: 9.0, scoreT: 9.5, scoreK: 10.0,
    overrideApplied: false,
    firstSeenAt: '2026-04-13T02:31:00Z', lastSeenAt: '2026-04-13T02:47:00Z',
    summary: 'Rotina de preços não executou na madrugada. 14 relatos em 4 grupos. 4ª ocorrência no mês.',
    sources: ['WHATSAPP', 'JIRA'],
    jiraUrl: 'https://grupomateus.atlassian.net/browse/GSM-4410',
    jiraKey: 'GSM-4410',
  },
  {
    id: 'cl-002',
    title: 'Pedido preso em doca — CD 87, faturamento bloqueado',
    systemCode: 'LOGISTICA_CD', categoryL1: 'Logística / CD',
    categoryL2: 'Geração de Nota Fiscal', categoryL3: 'Incidente operacional',
    status: 'IN_PROGRESS', aggregatePriorityScore: 81, priorityLevel: 'CRITICAL',
    feedbackCount: 8, uniqueGroupCount: 2,
    scoreS: 8.5, scoreV: 7.0, scoreR: 6.0, scoreT: 6.0, scoreK: 9.0,
    overrideApplied: false,
    firstSeenAt: '2026-04-13T09:14:00Z', lastSeenAt: '2026-04-13T09:38:00Z',
    summary: 'Nota fiscal não passa no CD 87. Motorista bloqueado há 24 minutos perdendo dinheiro.',
    sources: ['WHATSAPP', 'JIRA'],
    jiraUrl: 'https://grupomateus.atlassian.net/browse/GSM-4412',
    jiraKey: 'GSM-4412',
  },
  {
    id: 'cl-003',
    title: 'Erro de tributação em pedidos — Piauí',
    systemCode: 'GM_SUITE', categoryL1: 'ERP Proprietário',
    categoryL2: 'GM Suite', categoryL3: 'Incidente operacional',
    status: 'OPEN', aggregatePriorityScore: 74, priorityLevel: 'HIGH',
    feedbackCount: 6, uniqueGroupCount: 2,
    scoreS: 7.5, scoreV: 6.0, scoreR: 7.0, scoreT: 5.0, scoreK: 7.0,
    overrideApplied: false,
    firstSeenAt: '2026-04-13T08:02:00Z', lastSeenAt: '2026-04-13T09:50:00Z',
    summary: 'Divergência de tributos em pedidos do Piauí. Afeta faturamento de 3 lojas.',
    sources: ['JIRA'],
    jiraUrl: 'https://grupomateus.atlassian.net/browse/GSM-4408',
    jiraKey: 'GSM-4408',
  },
  {
    id: 'cl-004',
    title: 'Lentidão extrema no GM Suite — horário de pico',
    systemCode: 'GM_SUITE', categoryL1: 'ERP Proprietário',
    categoryL2: 'GM Suite', categoryL3: 'Lentidão / Performance',
    status: 'OPEN', aggregatePriorityScore: 61, priorityLevel: 'HIGH',
    feedbackCount: 11, uniqueGroupCount: 5,
    scoreS: 6.0, scoreV: 8.0, scoreR: 5.0, scoreT: 7.0, scoreK: 4.0,
    overrideApplied: false,
    firstSeenAt: '2026-04-13T07:45:00Z', lastSeenAt: '2026-04-13T10:12:00Z',
    summary: 'Tempo de resposta acima de 8s. 11 relatos em 5 grupos. Possível manutenção de banco.',
    sources: ['WHATSAPP'],
    jiraUrl: null, jiraKey: null,
  },
  {
    id: 'cl-005',
    title: 'Lock de banco — query financeiro travada',
    systemCode: 'INFRA', categoryL1: 'Infraestrutura / TI',
    categoryL2: 'Banco de Dados', categoryL3: 'Lock / Deadlock',
    status: 'RESOLVED', aggregatePriorityScore: 58, priorityLevel: 'HIGH',
    feedbackCount: 3, uniqueGroupCount: 1,
    scoreS: 7.0, scoreV: 3.0, scoreR: 6.0, scoreT: 5.0, scoreK: 6.0,
    overrideApplied: false,
    firstSeenAt: '2026-04-13T06:20:00Z', lastSeenAt: '2026-04-13T06:55:00Z',
    summary: 'Lock na base financeira. DBA executou kill do processo. Resolvido às 06h55.',
    sources: ['JIRA'],
    jiraUrl: 'https://grupomateus.atlassian.net/browse/GSM-4405',
    jiraKey: 'GSM-4405',
  },
  {
    id: 'cl-006',
    title: 'Fechamento contábil com erro — competência março',
    systemCode: 'FINANCEIRO', categoryL1: 'Financeiro / Contábil',
    categoryL2: 'Fechamento / Contabilidade', categoryL3: 'Incidente operacional',
    status: 'IN_PROGRESS', aggregatePriorityScore: 44, priorityLevel: 'MEDIUM',
    feedbackCount: 2, uniqueGroupCount: 1,
    scoreS: 5.0, scoreV: 2.0, scoreR: 3.0, scoreT: 4.0, scoreK: 5.0,
    overrideApplied: false,
    firstSeenAt: '2026-04-13T08:30:00Z', lastSeenAt: '2026-04-13T09:00:00Z',
    summary: 'Erro ao gerar relatório de fechamento de março. Operação continua.',
    sources: ['JIRA'],
    jiraUrl: 'https://grupomateus.atlassian.net/browse/GSM-4407',
    jiraKey: 'GSM-4407',
  },
  {
    id: 'cl-007',
    title: 'Usuário sem acesso ao módulo de separação',
    systemCode: 'GM_CORE', categoryL1: 'ERP Proprietário',
    categoryL2: 'GM Core', categoryL3: 'Incidente operacional',
    status: 'OPEN', aggregatePriorityScore: 31, priorityLevel: 'MEDIUM',
    feedbackCount: 1, uniqueGroupCount: 1,
    scoreS: 4.0, scoreV: 1.0, scoreR: 2.0, scoreT: 5.0, scoreK: 3.0,
    overrideApplied: true,
    firstSeenAt: '2026-04-13T10:05:00Z', lastSeenAt: '2026-04-13T10:05:00Z',
    summary: 'Colaborador do CD 116 sem permissão de acesso ao módulo de separação.',
    sources: ['WHATSAPP'],
    jiraUrl: null, jiraKey: null,
  },
  {
    id: 'cl-008',
    title: 'Solicitação de nova tela — relatório de vendas por loja',
    systemCode: 'GM_SUITE', categoryL1: 'ERP Proprietário',
    categoryL2: 'GM Suite', categoryL3: 'Solicitação de Melhoria',
    status: 'OPEN', aggregatePriorityScore: 8, priorityLevel: 'LOW',
    feedbackCount: 1, uniqueGroupCount: 1,
    scoreS: 1.0, scoreV: 1.0, scoreR: 0.0, scoreT: 1.0, scoreK: 0.0,
    overrideApplied: false,
    firstSeenAt: '2026-04-13T11:20:00Z', lastSeenAt: '2026-04-13T11:20:00Z',
    summary: 'Gerente solicita relatório de vendas diárias consolidado por loja.',
    sources: ['JIRA'],
    jiraUrl: 'https://grupomateus.atlassian.net/browse/GSM-4415',
    jiraKey: 'GSM-4415',
  },
];

export interface HeatmapPoint { day: string; hour: number; count: number; }
const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
export const mockHeatmap: HeatmapPoint[] = DAYS.flatMap((day, di) =>
  Array.from({ length: 24 }, (_, hour) => {
    const isWeekend = di === 0 || di === 6;
    const base = isWeekend ? 2 : 4;
    let count = base + Math.floor(Math.random() * 3);
    if (hour >= 0 && hour <= 5) count += isWeekend ? 6 : 12;
    if (hour >= 7 && hour <= 10 && !isWeekend) count += 14;
    if (hour >= 17 && hour <= 20 && !isWeekend) count += 8;
    return { day, hour, count };
  })
);

export interface SystemMetric {
  system: string; code: SystemCode;
  total: number; critical: number; high: number; medium: number; low: number;
}
export const mockSystemMetrics: SystemMetric[] = [
  { system: 'GM Core',      code: 'GM_CORE',      total: 38, critical: 12, high: 10, medium: 9,  low: 7 },
  { system: 'Logística/CD', code: 'LOGISTICA_CD', total: 31, critical: 9,  high: 11, medium: 8,  low: 3 },
  { system: 'GM Suite',     code: 'GM_SUITE',     total: 27, critical: 4,  high: 8,  medium: 10, low: 5 },
  { system: 'Financeiro',   code: 'FINANCEIRO',   total: 19, critical: 2,  high: 6,  medium: 7,  low: 4 },
  { system: 'Infra / BD',   code: 'INFRA',        total: 12, critical: 3,  high: 4,  medium: 3,  low: 2 },
  { system: 'Outros',       code: 'OUTRO',         total: 8,  critical: 0,  high: 1,  medium: 4,  low: 3 },
];

export interface RecurrencePoint { date: string; count: number; }

export interface RootProblem {
  id: string; title: string; systemCode: SystemCode;
  occurrenceCount: number;
  firstOccurredAt: string; lastOccurredAt: string;
  status: 'OPEN' | 'IN_INVESTIGATION' | 'RESOLVED';
  squadOwner: string;
  jiraEpicUrl: string | null;
  jiraEpicKey: string | null;
  avgDaysBetweenOccurrences: number;
  estimatedCostPerOccurrenceHours: number;
  recurrenceSeries: RecurrencePoint[];
}

function makeRecurrenceSeries(
  baseCount: number, weeks: number, trend: 'up' | 'down' | 'flat'
): RecurrencePoint[] {
  return Array.from({ length: weeks }, (_, i) => {
    const date = new Date('2026-01-20');
    date.setDate(date.getDate() + i * 7);
    const trendFactor = trend === 'up' ? 1 + i * 0.15 : trend === 'down' ? 1 - i * 0.08 : 1;
    const noise = Math.floor(Math.random() * 3) - 1;
    return {
      date: date.toISOString().split('T')[0],
      count: Math.max(0, Math.round(baseCount * trendFactor + noise)),
    };
  });
}

export const mockProblems: RootProblem[] = [
  {
    id: 'rp-001', title: 'Falha recorrente na rotina de carga noturna',
    systemCode: 'GM_CORE', occurrenceCount: 12,
    firstOccurredAt: '2026-02-01T03:00:00Z', lastOccurredAt: '2026-04-13T02:31:00Z',
    status: 'IN_INVESTIGATION', squadOwner: 'Squad ERP Core',
    jiraEpicUrl: 'https://grupomateus.atlassian.net/browse/GSM-3901', jiraEpicKey: 'GSM-3901',
    avgDaysBetweenOccurrences: 7, estimatedCostPerOccurrenceHours: 3,
    recurrenceSeries: makeRecurrenceSeries(1.5, 12, 'up'),
  },
  {
    id: 'rp-002', title: 'Pedidos presos em doca no CD (faturamento)',
    systemCode: 'LOGISTICA_CD', occurrenceCount: 21,
    firstOccurredAt: '2025-11-10T08:00:00Z', lastOccurredAt: '2026-04-13T09:14:00Z',
    status: 'OPEN', squadOwner: 'Squad Logística',
    jiraEpicUrl: 'https://grupomateus.atlassian.net/browse/GSM-3450', jiraEpicKey: 'GSM-3450',
    avgDaysBetweenOccurrences: 5, estimatedCostPerOccurrenceHours: 2,
    recurrenceSeries: makeRecurrenceSeries(2.5, 12, 'up'),
  },
  {
    id: 'rp-003', title: 'Lentidão sistêmica em horário de pico',
    systemCode: 'GM_SUITE', occurrenceCount: 34,
    firstOccurredAt: '2025-09-01T08:00:00Z', lastOccurredAt: '2026-04-13T07:45:00Z',
    status: 'IN_INVESTIGATION', squadOwner: 'Squad Performance',
    jiraEpicUrl: 'https://grupomateus.atlassian.net/browse/GSM-3100', jiraEpicKey: 'GSM-3100',
    avgDaysBetweenOccurrences: 3, estimatedCostPerOccurrenceHours: 1,
    recurrenceSeries: makeRecurrenceSeries(3.5, 12, 'flat'),
  },
  {
    id: 'rp-004', title: 'Lock de banco em queries do financeiro',
    systemCode: 'INFRA', occurrenceCount: 8,
    firstOccurredAt: '2026-01-15T06:00:00Z', lastOccurredAt: '2026-04-13T06:20:00Z',
    status: 'IN_INVESTIGATION', squadOwner: 'Squad Infra / DBA',
    jiraEpicUrl: 'https://grupomateus.atlassian.net/browse/GSM-3780', jiraEpicKey: 'GSM-3780',
    avgDaysBetweenOccurrences: 11, estimatedCostPerOccurrenceHours: 1.5,
    recurrenceSeries: makeRecurrenceSeries(1.0, 12, 'down'),
  },
  {
    id: 'rp-005', title: 'Divergência de tributos em pedidos interestaduais',
    systemCode: 'GM_SUITE', occurrenceCount: 6,
    firstOccurredAt: '2026-03-05T09:00:00Z', lastOccurredAt: '2026-04-13T08:02:00Z',
    status: 'OPEN', squadOwner: 'Não atribuído',
    jiraEpicUrl: null, jiraEpicKey: null,
    avgDaysBetweenOccurrences: 14, estimatedCostPerOccurrenceHours: 2.5,
    recurrenceSeries: makeRecurrenceSeries(0.8, 12, 'up'),
  },
];

export interface Feedback {
  id: string; source: Source; groupName: string; rawText: string;
  aiSeverityScore: number; aiSystemCode: SystemCode;
  priorityScore: number; priorityLevel: PriorityLevel;
  wasRecategorized: boolean; receivedAt: string; clusterId: string;
  jiraUrl: string | null; jiraKey: string | null;
}

export const mockFeedbacks: Feedback[] = [
  { id:'fb-001', source:'WHATSAPP', groupName:'GM Core Suporte CD', rawText:'Rotina caiu, alguém olha? Os preços não atualizaram!', aiSeverityScore:9.5, aiSystemCode:'GM_CORE', priorityScore:93, priorityLevel:'CRITICAL', wasRecategorized:false, receivedAt:'2026-04-13T02:31:00Z', clusterId:'cl-001', jiraUrl:'https://grupomateus.atlassian.net/browse/GSM-4410', jiraKey:'GSM-4410' },
  { id:'fb-002', source:'WHATSAPP', groupName:'CD Piauí Mateus', rawText:'GM Core tá fora aqui, sistema de preços parou', aiSeverityScore:9.0, aiSystemCode:'GM_CORE', priorityScore:93, priorityLevel:'CRITICAL', wasRecategorized:false, receivedAt:'2026-04-13T02:34:00Z', clusterId:'cl-001', jiraUrl:'https://grupomateus.atlassian.net/browse/GSM-4410', jiraKey:'GSM-4410' },
  { id:'fb-003', source:'WHATSAPP', groupName:'GM Core Suporte CD', rawText:'Estamos com pedido do faturamento mobi preso em doca, CD 87', aiSeverityScore:8.5, aiSystemCode:'LOGISTICA_CD', priorityScore:81, priorityLevel:'CRITICAL', wasRecategorized:false, receivedAt:'2026-04-13T09:14:00Z', clusterId:'cl-002', jiraUrl:'https://grupomateus.atlassian.net/browse/GSM-4412', jiraKey:'GSM-4412' },
  { id:'fb-004', source:'JIRA', groupName:'Jira — GSM-4412', rawText:'Erro ao tentar finalizar carregamento no CD 116. Mando suporte.', aiSeverityScore:8.0, aiSystemCode:'LOGISTICA_CD', priorityScore:81, priorityLevel:'CRITICAL', wasRecategorized:false, receivedAt:'2026-04-13T09:22:00Z', clusterId:'cl-002', jiraUrl:'https://grupomateus.atlassian.net/browse/GSM-4412', jiraKey:'GSM-4412' },
  { id:'fb-005', source:'JIRA', groupName:'Jira — GSM-4408 (Outros)', rawText:'Sistema lento para abrir notas no Piauí', aiSeverityScore:7.5, aiSystemCode:'GM_SUITE', priorityScore:74, priorityLevel:'HIGH', wasRecategorized:true, receivedAt:'2026-04-13T08:02:00Z', clusterId:'cl-003', jiraUrl:'https://grupomateus.atlassian.net/browse/GSM-4408', jiraKey:'GSM-4408' },
  { id:'fb-006', source:'WHATSAPP', groupName:'Balcão Venda Token', rawText:'Tá muito lento pra todo mundo, demora mais de 8 segundos pra carregar', aiSeverityScore:6.0, aiSystemCode:'GM_SUITE', priorityScore:61, priorityLevel:'HIGH', wasRecategorized:false, receivedAt:'2026-04-13T07:45:00Z', clusterId:'cl-004', jiraUrl:null, jiraKey:null },
  { id:'fb-007', source:'WHATSAPP', groupName:'Financeiro Fechamento', rawText:'Bom dia, erro ao fechar competência de março no módulo contábil', aiSeverityScore:5.0, aiSystemCode:'FINANCEIRO', priorityScore:44, priorityLevel:'MEDIUM', wasRecategorized:false, receivedAt:'2026-04-13T08:30:00Z', clusterId:'cl-006', jiraUrl:'https://grupomateus.atlassian.net/browse/GSM-4407', jiraKey:'GSM-4407' },
  { id:'fb-008', source:'JIRA', groupName:'Jira — GSM-4415 (Outros)', rawText:'Seria bom ter um relatório de vendas por loja no sistema', aiSeverityScore:1.0, aiSystemCode:'GM_SUITE', priorityScore:8, priorityLevel:'LOW', wasRecategorized:true, receivedAt:'2026-04-13T11:20:00Z', clusterId:'cl-008', jiraUrl:'https://grupomateus.atlassian.net/browse/GSM-4415', jiraKey:'GSM-4415' },
];

export const mockKPIs = {
  totalOpenIncidents: 7, criticalOpen: 2, highOpen: 2,
  avgResponseTimeMin: 28, recategorizedToday: 3,
  feedbacksLast24h: 135, whatsappGroups: 81, jiraTicketsToday: 47,
};
