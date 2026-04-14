import type { PriorityLevel } from '@/types/api';

export function priorityColor(level: PriorityLevel) {
  switch (level) {
    case 'CRITICAL': return 'bg-critical text-critical-light';
    case 'HIGH': return 'bg-high text-high-light';
    case 'MEDIUM': return 'bg-medium text-medium-light';
    case 'LOW': return 'bg-low text-low-light';
  }
}

export function priorityBorderColor(level: PriorityLevel) {
  switch (level) {
    case 'CRITICAL': return 'border-critical';
    case 'HIGH': return 'border-high';
    case 'MEDIUM': return 'border-medium';
    case 'LOW': return 'border-low';
  }
}

export function priorityBarColor(level: PriorityLevel) {
  switch (level) {
    case 'CRITICAL': return '#DC2626';
    case 'HIGH': return '#EA580C';
    case 'MEDIUM': return '#CA8A04';
    case 'LOW': return '#16A34A';
  }
}

export function priorityEmoji(level: PriorityLevel) {
  switch (level) {
    case 'CRITICAL': return '🔴';
    case 'HIGH': return '🟠';
    case 'MEDIUM': return '🟡';
    case 'LOW': return '🟢';
  }
}

export function statusLabel(status: string) {
  switch (status) {
    case 'OPEN': return 'Aberto';
    case 'IN_PROGRESS': return 'Em andamento';
    case 'IN_INVESTIGATION': return 'Em investigação';
    case 'RESOLVED': return 'Resolvido';
    default: return status;
  }
}

export function systemLabel(code: string) {
  const map: Record<string, string> = {
    GM_CORE: 'GM Core',
    GM_SUITE: 'GM Suite',
    GM_FIN: 'Financeiro',
    GM_LOG: 'Logística/CD',
    GM_INFRA: 'Infra / BD',
    GM_OTHER: 'Outros',
    // Legacy keys (frontend mockData compat)
    FINANCEIRO: 'Financeiro',
    LOGISTICA_CD: 'Logística/CD',
    INFRA: 'Infra / BD',
    OUTRO: 'Outros',
  };
  return map[code] || code;
}
