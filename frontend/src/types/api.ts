// Alinhado com os enums do Prisma backend
export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type Source = 'WHATSAPP' | 'JIRA';
export type SystemCode =
  | 'GM_CORE'
  | 'GM_SUITE'
  | 'GM_FIN'
  | 'GM_LOG'
  | 'GM_INFRA'
  | 'GM_OTHER';

export type IncidentStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'ROOT_CAUSE_IDENTIFIED'
  | 'EPIC_CREATED';

export interface IncidentCluster {
  id: string;
  title: string;
  systemCode: SystemCode;
  categoryL1: string;
  categoryL2: string;
  categoryL3: string;
  status: IncidentStatus;
  aggregatePriorityScore: number;
  priorityLevel: PriorityLevel;
  feedbackCount: number;
  uniqueGroupCount: number;
  scoreS: number;
  scoreV: number;
  scoreR: number;
  scoreT: number;
  scoreK: number;
  overrideApplied: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  summary: string;
  sources: Source[];
  jiraUrl: string | null;
  jiraKey: string | null;
}

export interface Feedback {
  id: string;
  source: Source;
  groupName: string;
  rawText: string;
  aiSeverityScore: number;
  aiSystemCode: SystemCode;
  priorityScore: number;
  priorityLevel: PriorityLevel;
  wasRecategorized: boolean;
  receivedAt: string;
  clusterId: string | null;
  jiraUrl: string | null;
  jiraKey: string | null;
}

export interface HeatmapPoint {
  day: string;
  hour: number;
  count: number;
}

export interface SystemMetric {
  system: string;
  code: SystemCode;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface RecurrencePoint {
  date: string;
  count: number;
}

export interface RootProblem {
  id: string;
  title: string;
  systemCode: SystemCode;
  occurrenceCount: number;
  firstOccurredAt: string;
  lastOccurredAt: string;
  status: string;
  squadOwner: string;
  jiraEpicUrl: string | null;
  jiraEpicKey: string | null;
  avgDaysBetweenOccurrences: number;
  estimatedCostPerOccurrenceHours: number;
  recurrenceSeries: RecurrencePoint[];
}

export interface KPIs {
  totalOpenIncidents: number;
  criticalOpen: number;
  highOpen: number;
  avgResponseTimeMin: number;
  feedbacksLast24h: number;
  recategorizedToday: number;
  whatsappGroups: number;
  jiraTicketsToday: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
