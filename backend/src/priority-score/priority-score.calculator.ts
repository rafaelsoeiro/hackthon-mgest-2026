import type {
  TimeWindow,
  KeywordRule,
  KeywordResult,
  PSInput,
  PSResult,
} from './priority-score.types.js';

// ─── Score V (Volume) ────────────────────────────────────

export function calcVolumeScore(count: number, windowMinutes: number): number {
  if (count >= 11 || windowMinutes <= 10) return 10;
  if (count >= 7 && windowMinutes <= 15) return 7;
  if (count >= 4 && windowMinutes <= 15) return 5;
  if (count >= 2 && count <= 3) return 3;
  if (count === 1) return 1;
  return 3;
}

// ─── Score R (Recorrência) ───────────────────────────────

export function calcRecurrenceScore(count30days: number): number {
  if (count30days >= 10) return 10;
  if (count30days >= 6) return 9;
  if (count30days >= 3) return 6;
  if (count30days >= 1) return 3;
  return 0;
}

// ─── Score T (Temporal) ──────────────────────────────────

export function calcTemporalScore(
  receivedAt: Date,
  timeWindows: TimeWindow[],
): number {
  const minuteOfDay = receivedAt.getHours() * 60 + receivedAt.getMinutes();

  for (const tw of timeWindows) {
    if (!tw.isActive) continue;

    const twStart = tw.startHour * 60 + tw.startMinute;
    const twEnd = tw.endHour * 60 + tw.endMinute;

    if (minuteOfDay >= twStart && minuteOfDay < twEnd) {
      return Math.min(10, 5 + tw.boost);
    }
  }

  return 5; // default quando nenhuma janela cobre o horário
}

// ─── Score K + Override (Keywords) ───────────────────────

export function calcKeywordScore(
  text: string,
  rules: KeywordRule[],
): KeywordResult {
  const lowerText = text.toLowerCase();
  let maxScore = 0;
  let forceOverride = false;
  let overrideMinPS: number | null = null;

  for (const rule of rules) {
    if (!rule.isActive) continue;

    if (lowerText.includes(rule.pattern.toLowerCase())) {
      if (rule.scoreK > maxScore) {
        maxScore = rule.scoreK;
      }
      if (rule.forceOverride) {
        forceOverride = true;
      }
      if (
        rule.overrideMinPS !== null &&
        (overrideMinPS === null || rule.overrideMinPS > overrideMinPS)
      ) {
        overrideMinPS = rule.overrideMinPS;
      }
    }
  }

  return { score: maxScore, forceOverride, overrideMinPS };
}

// ─── Priority Level ──────────────────────────────────────

export function mapPriorityLevel(
  ps: number,
): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (ps >= 75) return 'CRITICAL';
  if (ps >= 50) return 'HIGH';
  if (ps >= 25) return 'MEDIUM';
  return 'LOW';
}

// ─── Função Principal ────────────────────────────────────

export function calcPriorityScore(
  input: PSInput,
  timeWindows: TimeWindow[],
  keywordRules: KeywordRule[],
): PSResult {
  const S = input.severityScore;
  const V = calcVolumeScore(input.feedbackCount, input.windowMinutes);
  const R = calcRecurrenceScore(input.recurrenceCount30d);
  const T = calcTemporalScore(input.receivedAt, timeWindows);
  const keywordResult = calcKeywordScore(input.text, keywordRules);
  const K = keywordResult.score;

  // Fórmula base
  let PS = (S * 0.35 + V * 0.25 + R * 0.20 + T * 0.10 + K * 0.10) * 10;

  let overrideApplied = false;
  let overrideReason: string | null = null;

  // OR-01: forceOverride → PS=100 (precedência absoluta)
  if (keywordResult.forceOverride) {
    PS = 100;
    overrideApplied = true;
    overrideReason = 'Keyword crítica detectada';
  }

  // OR-02: overrideMinPS — só aplica se OR-01 não foi ativado
  if (
    !overrideApplied &&
    keywordResult.overrideMinPS !== null &&
    PS < keywordResult.overrideMinPS
  ) {
    PS = keywordResult.overrideMinPS;
    overrideApplied = true;
    overrideReason = `Override mínimo aplicado (minPS=${keywordResult.overrideMinPS})`;
  }

  // OR-03: anti-inflation — feedbacksInCluster=1, S<5, K=0, PS>40 → cap 40
  if (
    !overrideApplied &&
    input.feedbacksInCluster === 1 &&
    S < 5 &&
    K === 0 &&
    PS > 40
  ) {
    PS = 40;
    overrideApplied = true;
    overrideReason = 'Anti-inflation: relato único com baixa severidade';
  }

  // Clamp [0, 100]
  PS = Math.min(100, Math.max(0, Math.round(PS)));

  return {
    priorityScore: PS,
    priorityLevel: mapPriorityLevel(PS),
    overrideApplied,
    overrideReason,
    S,
    V,
    R,
    T,
    K,
  };
}
