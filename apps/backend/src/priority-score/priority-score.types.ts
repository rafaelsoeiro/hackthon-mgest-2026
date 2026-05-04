export interface TimeWindow {
  id: string;
  name: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  boost: number;
  isActive: boolean;
}

export interface KeywordRule {
  id: string;
  pattern: string;
  scoreK: number;
  forceOverride: boolean;
  overrideMinPS: number | null;
  description: string | null;
  isActive: boolean;
}

export interface PSInput {
  severityScore: number; // S: 0-10
  feedbackCount: number; // para calcular V
  windowMinutes: number; // janela de tempo dos feedbacks
  recurrenceCount30d: number; // ocorrências nos últimos 30 dias
  receivedAt: Date; // timestamp do feedback
  text: string; // texto para keyword matching
  feedbacksInCluster: number; // total de feedbacks no cluster/grupo
}

export interface KeywordResult {
  score: number;
  forceOverride: boolean;
  overrideMinPS: number | null;
}

export interface PSResult {
  priorityScore: number;
  priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  overrideApplied: boolean;
  overrideReason: string | null;
  S: number;
  V: number;
  R: number;
  T: number;
  K: number;
}
