import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, MessageSquare, AlertCircle, Info, Loader2, Clock, Activity, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFilters } from '@/contexts/FilterContext';
import { priorityColor, priorityBorderColor, priorityEmoji, systemLabel } from '@/utils/helpers';
import { useDashboardMetrics, useIncidents, useFeedbacks } from '@/hooks/use-api';
import { CountUp } from '@/components/CountUp';
import { Skeleton } from '@/components/ui/skeleton';
import type { IncidentCluster, Feedback, SystemCode } from '@/types/api';

const SYSTEM_CODES: SystemCode[] = ['GM_CORE', 'GM_SUITE', 'GM_FIN', 'GM_LOG', 'GM_INFRA'];

export default function Dashboard() {
  const { systemFilter, period, setPeriod } = useFilters();
  const [sortBy, setSortBy] = useState<'ps' | 'volume' | 'date'>('ps');

  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: incidentsRes, isLoading: incidentsLoading } = useIncidents({ system: systemFilter, sort: sortBy });
  const { data: feedbacksRes, isLoading: feedbacksLoading } = useFeedbacks({ system: systemFilter });

  const clusters = incidentsRes?.data ?? [];
  const feedbacks = feedbacksRes?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Visão Geral</h1>
          <p className="text-sm text-muted-foreground">Grupo Mateus — Operações de TI</p>
        </div>
        <div className="flex items-center gap-2">
          {metrics && metrics.criticalIncidents > 0 && (
            <span className="bg-critical/20 text-critical px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              🔴 {metrics.criticalIncidents} críticos abertos
            </span>
          )}
          {(['24h', '7d', '30d'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                period === p
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-accent border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards — 4 columns */}
      <div className="grid grid-cols-4 gap-4">
        {metricsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </>
        ) : metrics ? (
          <>
            <MetricCard
              label="Feedbacks 24h"
              icon={<MessageSquare className="w-4 h-4" />}
              value={metrics.totalFeedbacks}
            />
            <MetricCard
              label="Incidentes Críticos"
              icon={<AlertCircle className="w-4 h-4" />}
              value={metrics.criticalIncidents}
              critical
            />
            <MetricCard
              label="Tempo Médio Resolução"
              icon={<Clock className="w-4 h-4" />}
              value={metrics.avgResolutionTimeMinutes}
              suffix="min"
            />
            <MetricCard
              label="Sistema Mais Crítico"
              icon={<AlertTriangle className="w-4 h-4" />}
              textValue={getMostCriticalSystem(metrics.systemHealthScore)}
            />
          </>
        ) : null}
      </div>

      {/* System Health Scores */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4" /> System Health Scores
        </h3>
        {metricsLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : metrics ? (
          <div className="space-y-3">
            {SYSTEM_CODES.map(code => {
              const health = metrics.systemHealthScore?.[code];
              const score = health?.healthScore ?? 100;
              const color = score < 40 ? 'bg-red-500' : score <= 70 ? 'bg-orange-500' : 'bg-green-500';
              const textColor = score < 40 ? 'text-red-500' : score <= 70 ? 'text-orange-500' : 'text-green-500';
              return (
                <div key={code} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-24 shrink-0">{systemLabel(code)}</span>
                  <div className="flex-1 h-3 bg-accent rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${color}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className={`font-mono text-sm font-bold w-10 text-right ${textColor}`}>
                    {Math.round(score)}
                  </span>
                  {health && health.openIncidents > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({health.openIncidents} aberto{health.openIncidents > 1 ? 's' : ''})
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Main content 60/40 */}
      <div className="grid grid-cols-5 gap-6">
        {/* Priority Queue 60% */}
        <div className="col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Fila de Prioridade</h2>
            <div className="flex gap-1">
              {([['ps', 'Score'], ['volume', 'Volume'], ['date', 'Data']] as const).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setSortBy(k)}
                  className={`text-xs px-2 py-1 rounded ${sortBy === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          {incidentsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
          ) : (
            clusters.map(c => (
              <ClusterCard key={c.id} cluster={c} />
            ))
          )}
          <Link
            to="/queue"
            className="block text-center text-sm text-primary hover:underline py-2"
          >
            Ver fila completa →
          </Link>
        </div>

        {/* Feed 40% */}
        <div className="col-span-2 space-y-3">
          <h2 className="text-lg font-semibold">Feed Recente</h2>
          <div className="space-y-2 max-h-[600px] overflow-auto scrollbar-thin">
            {feedbacks.map(f => (
              <div key={f.id} className="bg-card border border-border rounded-lg p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    f.source === 'WHATSAPP' ? 'bg-whatsapp/20 text-whatsapp' : 'bg-jira/20 text-jira'
                  }`}>
                    {f.source === 'WHATSAPP' ? 'WPP' : 'JIRA'}
                  </span>
                  <span className="text-xs text-muted-foreground flex-1 truncate">{f.groupName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(f.receivedAt), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 line-clamp-2">{f.rawText}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${priorityColor(f.priorityLevel)}`}>
                    {priorityEmoji(f.priorityLevel)} {f.priorityScore}
                  </span>
                  {f.wasRecategorized && (
                    <span className="text-xs text-medium flex items-center gap-1">⚡ IA</span>
                  )}
                  {f.jiraKey && (
                    <a href={f.jiraUrl!} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-jira hover:underline">
                      {f.jiraKey} ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getMostCriticalSystem(
  scores: Record<string, { healthScore: number }> | undefined,
): string {
  if (!scores) return '—';
  let worst = '';
  let worstScore = Infinity;
  for (const [code, data] of Object.entries(scores)) {
    if (data.healthScore < worstScore) {
      worstScore = data.healthScore;
      worst = code;
    }
  }
  return worst ? systemLabel(worst) : '—';
}

function MetricCard({
  label,
  icon,
  value,
  suffix = '',
  critical,
  textValue,
}: {
  label: string;
  icon: React.ReactNode;
  value?: number;
  suffix?: string;
  critical?: boolean;
  textValue?: string;
}) {
  return (
    <div className={`bg-card border rounded-lg p-4 ${critical ? 'border-red-500/50' : 'border-border'}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        {icon}
        {label}
      </div>
      {textValue ? (
        <p className="font-mono text-2xl font-bold text-foreground">{textValue}</p>
      ) : (
        <CountUp
          end={value ?? 0}
          suffix={suffix}
          className={`font-mono text-2xl font-bold ${critical ? 'text-red-500' : 'text-foreground'}`}
        />
      )}
    </div>
  );
}

function ClusterCard({ cluster: c }: { cluster: IncidentCluster }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-card border rounded-lg p-4 space-y-2 cursor-pointer transition-colors hover:border-muted-foreground/30 ${priorityBorderColor(c.priorityLevel)} ${
      c.priorityLevel === 'CRITICAL' ? 'border-l-4' : ''
    }`} onClick={() => setExpanded(!expanded)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor(c.priorityLevel)}`}>
              {priorityEmoji(c.priorityLevel)} {c.priorityLevel}
            </span>
            <Link to={`/incident/${c.id}`} className="text-sm font-medium hover:text-primary truncate" onClick={e => e.stopPropagation()}>
              {c.title}
            </Link>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span>{c.feedbackCount} relatos</span>
            <span>{c.uniqueGroupCount} grupos</span>
            {c.sources.map(s => (
              <span key={s} className={`px-1.5 py-0.5 rounded text-xs ${
                s === 'WHATSAPP' ? 'bg-whatsapp/20 text-whatsapp' : 'bg-jira/20 text-jira'
              }`}>{s === 'WHATSAPP' ? 'WPP' : 'JIRA'}</span>
            ))}
            <span>
              {formatDistanceToNow(new Date(c.lastSeenAt), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="font-mono text-xl font-bold">{c.aggregatePriorityScore}</span>
          <div className="w-20 h-1.5 bg-accent rounded-full mt-1">
            <div
              className="h-full rounded-full"
              style={{
                width: `${c.aggregatePriorityScore}%`,
                backgroundColor: c.priorityLevel === 'CRITICAL' ? '#DC2626' : c.priorityLevel === 'HIGH' ? '#EA580C' : c.priorityLevel === 'MEDIUM' ? '#CA8A04' : '#16A34A',
              }}
            />
          </div>
        </div>
      </div>

      {/* Jira chip */}
      {c.jiraKey && (
        <div className="flex items-center gap-2">
          <a
            href={c.jiraUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-jira border border-jira/30 rounded px-2 py-0.5 hover:bg-jira/10"
            onClick={e => e.stopPropagation()}
          >
            <span className="w-4 h-4 bg-jira rounded-sm flex items-center justify-center text-[10px] font-bold text-primary-foreground">J</span>
            {c.jiraKey}
          </a>
          {c.priorityLevel === 'CRITICAL' && (
            <a
              href={c.jiraUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-jira border border-jira rounded-md px-3 py-1 hover:bg-jira/10 font-medium"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
              Ver chamado no Jira
            </a>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{c.summary}</p>

      {expanded && (
        <div className="flex items-center gap-3 pt-2 border-t border-border">
          {[['S', c.scoreS], ['V', c.scoreV], ['R', c.scoreR], ['T', c.scoreT], ['K', c.scoreK]].map(([k, v]) => (
            <span key={k as string} className="text-xs font-mono bg-accent px-2 py-0.5 rounded text-muted-foreground">
              {k}:{v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
