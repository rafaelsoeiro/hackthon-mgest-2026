import { useState } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { useFilters } from '@/contexts/FilterContext';
import { exportToCsv } from '@/utils/exportCsv';
import { priorityColor, priorityEmoji, statusLabel, systemLabel, priorityBarColor } from '@/utils/helpers';
import { Download, ExternalLink, ChevronDown, ChevronRight, X, Loader2 } from 'lucide-react';
import { useIncidents, useFeedbacks } from '@/hooks/use-api';

export default function ClustersPage() {
  const { systemFilter } = useFilters();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<string | null>(null);

  const { data: incidentsRes, isLoading: incidentsLoading } = useIncidents({ system: systemFilter });
  const { data: feedbacksRes } = useFeedbacks({ clusterId: feedbackModal ?? undefined });

  const clusters = incidentsRes?.data ?? [];
  const modalFeedbacks = feedbacksRes?.data ?? [];

  if (incidentsLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const treemapData = clusters.map(c => ({
    name: c.title.slice(0, 30),
    size: c.feedbackCount,
    fill: priorityBarColor(c.priorityLevel),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agrupamento por IA</h1>
        <button
          onClick={() => exportToCsv('clusters_icf.csv', clusters.map(c => ({
            id: c.id, titulo: c.title, sistema: systemLabel(c.systemCode),
            nivel: c.priorityLevel, ps: c.aggregatePriorityScore,
            relatos: c.feedbackCount, grupos: c.uniqueGroupCount,
            fontes: c.sources.join(', '), jira: c.jiraKey || '—', status: c.status,
          })))}
          className="flex items-center gap-2 bg-accent border border-border text-sm px-4 py-2 rounded-lg hover:bg-accent/80 text-foreground"
        >
          <Download className="w-4 h-4" /> Exportar tabela
        </button>
      </div>

      {/* Treemap */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold mb-4">Treemap — Tamanho = Relatos, Cor = Nível</h3>
        <ResponsiveContainer width="100%" height={240}>
          <Treemap
            data={treemapData}
            dataKey="size"
            nameKey="name"
            stroke="#0F172A"
            content={({ x, y, width, height, name, fill }) => (
              <g>
                <rect x={x} y={y} width={width} height={height} fill={fill as string} rx={4} opacity={0.85} />
                {(width as number) > 60 && (height as number) > 20 && (
                  <text x={(x as number) + 4} y={(y as number) + 14} fill="#fff" fontSize={10} fontFamily="DM Sans">
                    {name}
                  </text>
                )}
              </g>
            )}
          >
            <Tooltip
              contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#F1F5F9' }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>

      {/* Expandable Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="p-3 w-8" />
              <th className="p-3">Cluster</th>
              <th className="p-3">Sistema</th>
              <th className="p-3">Nível</th>
              <th className="p-3 font-mono">PS</th>
              <th className="p-3">Relatos</th>
              <th className="p-3">Grupos</th>
              <th className="p-3">Fontes</th>
              <th className="p-3">Jira</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {clusters.map(c => {
              const isExpanded = expandedId === c.id;
              return (
                <>
                  <tr
                    key={c.id}
                    className={`border-b border-border cursor-pointer hover:bg-accent/50 transition-colors ${
                      c.priorityLevel === 'CRITICAL' && c.jiraKey ? 'bg-critical/5' : ''
                    }`}
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  >
                    <td className="p-3">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </td>
                    <td className="p-3 font-medium max-w-[200px] truncate">{c.title}</td>
                    <td className="p-3 text-muted-foreground">{systemLabel(c.systemCode)}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor(c.priorityLevel)}`}>
                        {priorityEmoji(c.priorityLevel)} {c.priorityLevel}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold">{c.aggregatePriorityScore}</td>
                    <td className="p-3 font-mono">{c.feedbackCount}</td>
                    <td className="p-3 font-mono">{c.uniqueGroupCount}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {c.sources.map(s => (
                          <span key={s} className={`text-xs px-1.5 py-0.5 rounded ${s === 'WHATSAPP' ? 'bg-whatsapp/20 text-whatsapp' : 'bg-jira/20 text-jira'}`}>
                            {s === 'WHATSAPP' ? 'WPP' : 'JIRA'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      {c.jiraKey ? (
                        <a href={c.jiraUrl!} target="_blank" rel="noopener noreferrer"
                           className={`inline-flex items-center gap-1 text-xs text-jira hover:underline ${
                             c.priorityLevel === 'CRITICAL' ? 'font-bold' : ''
                           }`}
                           onClick={e => e.stopPropagation()}>
                          <span className="w-3.5 h-3.5 bg-jira rounded-sm flex items-center justify-center text-[8px] font-bold text-primary-foreground">J</span>
                          {c.jiraKey} ↗
                        </a>
                      ) : '—'}
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{statusLabel(c.status)}</td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${c.id}-expanded`} className="bg-accent/30">
                      <td colSpan={10} className="p-4">
                        <div className="flex items-center gap-4 mb-3">
                          {[['S', c.scoreS], ['V', c.scoreV], ['R', c.scoreR], ['T', c.scoreT], ['K', c.scoreK]].map(([k, v]) => (
                            <div key={k as string} className="flex items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground w-3">{k}</span>
                              <div className="w-20 h-2 bg-accent rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${(v as number) * 10}%` }} />
                              </div>
                              <span className="text-xs font-mono">{v as number}</span>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); setFeedbackModal(c.id); }}
                          className="text-xs text-primary hover:underline"
                        >
                          Ver feedbacks →
                        </button>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setFeedbackModal(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Feedbacks do Cluster</h3>
              <button onClick={() => setFeedbackModal(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              {modalFeedbacks.map(f => (
                <div key={f.id} className="border border-border rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={f.source === 'WHATSAPP' ? 'text-whatsapp' : 'text-jira'}>{f.source}</span>
                    <span className="text-muted-foreground">{f.groupName}</span>
                  </div>
                  <p className="text-sm">{f.rawText}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
