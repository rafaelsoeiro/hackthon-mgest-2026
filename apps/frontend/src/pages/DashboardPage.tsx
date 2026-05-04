import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, MessageSquare, AlertCircle, Info, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFilters } from '@/contexts/FilterContext';
import { priorityColor, priorityBorderColor, priorityEmoji, systemLabel } from '@/utils/helpers';
import { useOverview, useIncidents, useFeedbacks } from '@/hooks/use-api';
import type { IncidentCluster, Feedback } from '@/types/api';

export default function Dashboard() {
  const { systemFilter, period, setPeriod } = useFilters();
  const [sortBy, setSortBy] = useState<'ps' | 'volume' | 'date'>('ps');

  const { data: kpis, isLoading: kpisLoading } = useOverview(period);
  const { data: incidentsRes, isLoading: incidentsLoading } = useIncidents({ system: systemFilter, sort: sortBy });
  const { data: feedbacksRes, isLoading: feedbacksLoading } = useFeedbacks({ system: systemFilter });

  const clusters = incidentsRes?.data ?? [];
  const feedbacks = feedbacksRes?.data ?? [];
  const mockKPIs = kpis ?? { totalOpenIncidents: 0, criticalOpen: 0, highOpen: 0, avgResponseTimeMin: 0, feedbacksLast24h: 0, recategorizedToday: 0, whatsappGroups: 0, jiraTicketsToday: 0 };

  const isLoading = kpisLoading || incidentsLoading || feedbacksLoading;

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {!isLoading && <>
      {/* Philosophy banner */}
      <div className="bg-accent/50 border border-border rounded-lg px-4 py-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="w-4 h-4 shrink-0" />
        O Prisma não substitui o Jira — use os links abaixo para acessar os chamados originais
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Visão Geral</h1>
          <p className="text-sm text-muted-foreground">Grupo Mateus — Operações de TI</p>
        </div>
        <div className="flex items-center gap-2">
          {mockKPIs.criticalOpen > 0 && (
            <span className="bg-critical/20 text-critical px-3 py-1 rounded-full text-sm font-medium animate-pulse-critical">
              🔴 {mockKPIs.criticalOpen} críticos abertos
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

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Incidentes abertos" value={mockKPIs.totalOpenIncidents} />
        <KpiCard label="Críticos" value={mockKPIs.criticalOpen} critical />
        <KpiCard label="Tempo médio resposta" value={`${mockKPIs.avgResponseTimeMin}min`} />
        <KpiCard label="Feedbacks 24h" value={mockKPIs.feedbacksLast24h} />
        <KpiCard label="Recategorizados por IA" value={mockKPIs.recategorizedToday} />
        <KpiCard label="Grupos WA monitorados" value={mockKPIs.whatsappGroups} />
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
          {clusters.map(c => (
            <ClusterCard key={c.id} cluster={c} />
          ))}
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
      </>}
    </div>
  );
}

function KpiCard({ label, value, critical }: { label: string; value: string | number; critical?: boolean }) {
  return (
    <div className={`bg-card border rounded-lg p-4 ${critical ? 'border-critical' : 'border-border'}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`font-mono text-2xl font-bold ${critical ? 'text-critical animate-pulse-critical' : 'text-foreground'}`}>
        {typeof value === 'number' ? Math.round(value) : value}
      </p>
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
