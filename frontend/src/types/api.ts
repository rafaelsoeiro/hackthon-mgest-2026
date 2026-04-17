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

// ─── Dashboard Metrics (GET /api/v1/dashboard/metrics) ─────

export interface SystemHealthScore {
  openIncidents: number;
  avgPriorityScore: number;
  healthScore: number;
}

export interface DashboardMetrics {
  totalFeedbacks: number;
  criticalIncidents: number;
  highIncidents: number;
  newIncidentGroups: number;
  avgResolutionTimeMinutes: number;
  systemHealthScore: Record<SystemCode, SystemHealthScore>;
}

// ─── Priority Queue (GET /api/v1/dashboard/priority-queue) ──

export interface QueueIncident {
  id: string;
  title: string;
  systemCode: SystemCode;
  status: IncidentStatus;
  priorityScore: number;
  priorityLevel: PriorityLevel;
  feedbackCount: number;
  recurrenceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  overrideApplied: boolean;
  topKeywords: string[];
  sources?: Source[];
}

export interface PriorityQueueResponse {
  data: QueueIncident[];
  total: number;
  page: number;
  limit: number;
}

// ─── Incident Detail (GET /api/v1/incidents/:id) ────────────

export interface IncidentOccurrence {
  id: string;
  occurredAt: string;
  resolvedAt: string | null;
  scoreSnapshot: number;
}

export interface IncidentDetail extends IncidentCluster {
  feedbacks: Feedback[];
  occurrences: IncidentOccurrence[];
}

// ─── Heatmap (GET /dashboard/heatmap) ───────────────────

export interface HeatmapCell {
  day: string;
  dayOfWeek: number;
  hour: number;
  count: number;
  averagePriorityScore: number;
}

// ─── Recurrences (GET /dashboard/recurrences) ───────────

export interface RecurrenceIncident {
  id: string;
  title: string;
  systemCode: SystemCode;
  feedbackType: string;
  priorityScore: number;
  priorityLevel: PriorityLevel;
  status: IncidentStatus;
  feedbackCount: number;
  recurrenceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt: string | null;
  epicJiraKey?: string | null;
  occurrences: IncidentOccurrence[];
}

// ─── Config: TimeWindow ─────────────────────────────────

export interface TimeWindow {
  id: string;
  name: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  boost: number;
  isActive: boolean;
  createdAt: string;
}

// ─── Config: KeywordRule ────────────────────────────────

export interface KeywordRule {
  id: string;
  pattern: string;
  scoreK: number;
  forceOverride: boolean;
  overrideMinPS: number | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

// ─── Config: WhatsAppGroup ──────────────────────────────

export interface WhatsAppGroup {
  id: string;
  groupId: string;
  groupName: string;
  memberCount: number | null;
  isMonitored: boolean;
  systemHint: SystemCode | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Config: JiraSyncLog ────────────────────────────────

export interface JiraSyncLog {
  id: string;
  syncedAt: string;
  issuesFetched: number;
  issuesCreated: number;
  issuesFailed: number;
  lastJiraUpdated: string | null;
  errorDetails: unknown;
}
