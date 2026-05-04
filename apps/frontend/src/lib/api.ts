import { env } from '@/config/env';

const BASE_URL = env.apiUrl;

function assertFeatureAllowed(path: string) {
  if (!env.featureJiraEnabled && (path.startsWith('/jira') || path.startsWith('/ingestion/sync-jira'))) {
    throw new Error(
      'Feature Jira desabilitada no frontend. Defina VITE_FEATURE_JIRA_ENABLED=true para usar endpoints Jira.',
    );
  }

  if (!env.featureEvolutionEnabled && path.startsWith('/evolution')) {
    throw new Error(
      'Feature Evolution desabilitada no frontend. Defina VITE_FEATURE_EVOLUTION_ENABLED=true para usar endpoints Evolution.',
    );
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  assertFeatureAllowed(path);

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const details = body?.details?.path ? ` (${body.details.path})` : '';
    throw new Error(body.message || `API error ${res.status}${details}`);
  }

  return res.json();
}
