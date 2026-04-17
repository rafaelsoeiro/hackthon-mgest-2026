import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  KPIs,
  SystemMetric,
  HeatmapPoint,
  HeatmapCell,
  IncidentCluster,
  Feedback,
  RootProblem,
  PaginatedResponse,
  DashboardMetrics,
  PriorityQueueResponse,
  IncidentDetail,
  RecurrenceIncident,
  TimeWindow,
  KeywordRule,
  WhatsAppGroup,
  JiraSyncLog,
} from '@/types/api';

// ─── Dashboard ──────────────────────────────────────────

export function useOverview(period: '24h' | '7d' | '30d') {
  return useQuery<KPIs>({
    queryKey: ['dashboard', 'overview', period],
    queryFn: () => api(`/dashboard/overview?period=${period}`),
  });
}

export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => api('/dashboard/metrics'),
    refetchInterval: 60_000,
  });
}

export function useSystemMetrics() {
  return useQuery<SystemMetric[]>({
    queryKey: ['dashboard', 'by-system'],
    queryFn: () => api('/dashboard/by-system'),
  });
}

export function useHeatmap(period: '24h' | '7d' | '30d' = '7d') {
  return useQuery<HeatmapPoint[]>({
    queryKey: ['dashboard', 'heatmap', period],
    queryFn: () => api(`/dashboard/heatmap?period=${period}`),
  });
}

export function useHeatmapCells(days: number = 30, systemCode?: string) {
  const params = new URLSearchParams();
  if (days <= 1) params.set('period', '24h');
  else if (days <= 7) params.set('period', '7d');
  else params.set('period', '30d');
  if (systemCode) params.set('systemCode', systemCode);
  return useQuery<HeatmapCell[]>({
    queryKey: ['dashboard', 'heatmap-cells', days, systemCode],
    queryFn: () => api(`/dashboard/heatmap?${params.toString()}`),
    refetchInterval: 5 * 60_000, // auto-refresh every 5 minutes
  });
}

// ─── Incidents ──────────────────────────────────────────

export function useIncidents(filters: {
  system?: string;
  sort?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  if (filters.system && filters.system !== 'ALL') params.set('system', filters.system);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.status) params.set('status', filters.status);

  const qs = params.toString();
  return useQuery<PaginatedResponse<IncidentCluster>>({
    queryKey: ['incidents', filters],
    queryFn: () => api(`/incidents${qs ? `?${qs}` : ''}`),
  });
}

export function useIncident(id: string | undefined) {
  return useQuery<IncidentCluster & { feedbacks: Feedback[]; occurrences: any[] }>({
    queryKey: ['incidents', id],
    queryFn: () => api(`/incidents/${id}`),
    enabled: !!id,
  });
}

export function useProblems() {
  return useQuery<RootProblem[]>({
    queryKey: ['incidents', 'problems'],
    queryFn: () => api('/incidents/problems'),
  });
}

export function useOverrideMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      priorityLevel: string;
      reason: string;
      adjustedBy: string;
    }) =>
      api(`/incidents/${vars.id}/override`, {
        method: 'PATCH',
        body: JSON.stringify({
          priorityLevel: vars.priorityLevel,
          reason: vars.reason,
          adjustedBy: vars.adjustedBy,
        }),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['incidents', vars.id] });
      qc.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}

// ─── Feedbacks ──────────────────────────────────────────

export function useFeedbacks(filters: {
  system?: string;
  clusterId?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters.system && filters.system !== 'ALL') params.set('system', filters.system);
  if (filters.clusterId) params.set('clusterId', filters.clusterId);
  if (filters.limit) params.set('limit', String(filters.limit));

  const qs = params.toString();
  return useQuery<PaginatedResponse<Feedback>>({
    queryKey: ['feedbacks', filters],
    queryFn: () => api(`/feedbacks${qs ? `?${qs}` : ''}`),
  });
}

// ─── Priority Queue ─────────────────────────────────────

export function usePriorityQueue(filters: {
  systemCode?: string;
  priorityLevel?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters.systemCode) params.set('systemCode', filters.systemCode);
  if (filters.priorityLevel) params.set('priorityLevel', filters.priorityLevel);
  if (filters.status) params.set('status', filters.status);
  if (filters.page) params.set('page', String(filters.page));
  params.set('limit', String(filters.limit ?? 20));

  const qs = params.toString();
  return useQuery<PriorityQueueResponse>({
    queryKey: ['dashboard', 'priority-queue', filters],
    queryFn: () => api(`/dashboard/priority-queue?${qs}`),
  });
}

export function useIncidentDetail(id: string | null) {
  return useQuery<IncidentDetail>({
    queryKey: ['incidents', id],
    queryFn: () => api(`/incidents/${id}`),
    enabled: !!id,
  });
}

export function usePriorityOverrideMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      priorityLevel: string;
      reason: string;
    }) =>
      api(`/incidents/${vars.id}/priority`, {
        method: 'PATCH',
        body: JSON.stringify({
          priorityLevel: vars.priorityLevel,
          reason: vars.reason,
        }),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['incidents', vars.id] });
      qc.invalidateQueries({ queryKey: ['incidents'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'priority-queue'] });
    },
  });
}

// ─── Recurrences ────────────────────────────────────────

export function useRecurrences() {
  return useQuery<RecurrenceIncident[]>({
    queryKey: ['dashboard', 'recurrences'],
    queryFn: () => api('/dashboard/recurrences'),
  });
}

// ─── Config: TimeWindows ────────────────────────────────

export function useTimeWindows() {
  return useQuery<TimeWindow[]>({
    queryKey: ['config', 'time-windows'],
    queryFn: () => api('/api/v1/config/time-windows'),
  });
}

export function useCreateTimeWindow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<TimeWindow, 'id' | 'createdAt'>) =>
      api('/api/v1/config/time-windows', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config', 'time-windows'] }),
  });
}

export function useDeleteTimeWindow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/config/time-windows/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config', 'time-windows'] }),
  });
}

// ─── Config: KeywordRules ───────────────────────────────

export function useKeywordRules() {
  return useQuery<KeywordRule[]>({
    queryKey: ['config', 'keyword-rules'],
    queryFn: () => api('/api/v1/config/keyword-rules'),
  });
}

export function useCreateKeywordRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<KeywordRule, 'id' | 'createdAt'>) =>
      api('/api/v1/config/keyword-rules', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config', 'keyword-rules'] }),
  });
}

export function useDeleteKeywordRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/config/keyword-rules/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config', 'keyword-rules'] }),
  });
}

// ─── Config: WhatsApp Groups ────────────────────────────

export function useWhatsAppGroups() {
  return useQuery<WhatsAppGroup[]>({
    queryKey: ['config', 'whatsapp-groups'],
    queryFn: () => api('/api/v1/config/whatsapp-groups'),
  });
}

export function useUpdateWhatsAppGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; isMonitored?: boolean; systemHint?: string | null }) =>
      api(`/api/v1/config/whatsapp-groups/${vars.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isMonitored: vars.isMonitored, systemHint: vars.systemHint }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config', 'whatsapp-groups'] }),
  });
}

// ─── Jira Sync ──────────────────────────────────────────

export function useJiraSyncLogs() {
  return useQuery<JiraSyncLog[]>({
    queryKey: ['jira', 'sync-logs'],
    queryFn: () => api('/api/v1/config/time-windows').then(() => []).catch(() => []),
  });
}

export function useLastJiraSyncLog() {
  return useQuery<JiraSyncLog | null>({
    queryKey: ['jira', 'last-sync'],
    queryFn: async () => {
      try {
        const logs = await api<JiraSyncLog[]>('/api/v1/config/time-windows');
        return null;
      } catch {
        return null;
      }
    },
  });
}

export function useTriggerJiraSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api('/api/v1/jira/sync'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jira'] }),
  });
}
