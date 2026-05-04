import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  KPIs,
  SystemMetric,
  HeatmapPoint,
  IncidentCluster,
  Feedback,
  RootProblem,
  PaginatedResponse,
} from '@/types/api';

// ─── Dashboard ──────────────────────────────────────────

export function useOverview(period: '24h' | '7d' | '30d') {
  return useQuery<KPIs>({
    queryKey: ['dashboard', 'overview', period],
    queryFn: () => api(`/dashboard/overview?period=${period}`),
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
