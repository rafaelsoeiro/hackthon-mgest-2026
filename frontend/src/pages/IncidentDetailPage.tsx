import { useParams, Link } from 'react-router-dom';
import { priorityColor, priorityEmoji, statusLabel, systemLabel, priorityBarColor } from '@/utils/helpers';
import { exportToCsv } from '@/utils/exportCsv';
import { ArrowLeft, ExternalLink, Download, Zap, Info, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { useIncident, useOverrideMutation } from '@/hooks/use-api';

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: incident, isLoading } = useIncident(id);
  const overrideMutation = useOverrideMutation();
  const [overrideScore, setOverrideScore] = useState('');
  const [overrideJustification, setOverrideJustification] = useState('');

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Incidente não encontrado</p>
        <Link to="/dashboard" className="text-primary hover:underline">Voltar ao Dashboard</Link>
      </div>
    );
  }

  const c = incident;
  const feedbacks = incident.feedbacks ?? [];
  const scoreBreakdown = [
    { key: 'S', label: 'Severidade', weight: '35%', value: c.scoreS },
    { key: 'V', label: 'Volume', weight: '25%', value: c.scoreV },
    { key: 'R', label: 'Recorrência', weight: '20%', value: c.scoreR },
    { key: 'T', label: 'Temporal', weight: '10%', value: c.scoreT },
    { key: 'K', label: 'Keywords', weight: '10%', value: c.scoreK },
  ];

  const formula = `(${c.scoreS}×0.35) + (${c.scoreV}×0.25) + (${c.scoreR}×0.20) + (${c.scoreT}×0.10) + (${c.scoreK}×0.10) = ${(
    c.scoreS * 0.35 + c.scoreV * 0.25 + c.scoreR * 0.20 + c.scoreT * 0.10 + c.scoreK * 0.10
  ).toFixed(1)} × 10 = ${c.aggregatePriorityScore}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityColor(c.priorityLevel)}`}>
              {priorityEmoji(c.priorityLevel)} {c.priorityLevel}
            </span>
            <h1 className="text-xl font-bold">{c.title}</h1>
            <span className={`text-xs px-2 py-0.5 rounded ${
              c.status === 'OPEN' ? 'bg-critical/20 text-critical' :
              c.status === 'IN_PROGRESS' ? 'bg-medium/20 text-medium' :
              'bg-low/20 text-low'
            }`}>
              {statusLabel(c.status)}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end shrink-0">
          {c.jiraKey && (
            <a
              href={c.jiraUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-jira/10 text-jira border border-jira rounded-lg px-4 py-2.5 font-medium hover:bg-jira/20 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir chamado no Jira — Ver/atualizar
            </a>
          )}
          <p className="text-xs text-muted-foreground max-w-[280px] text-right flex items-center gap-1">
            <Info className="w-3 h-3 shrink-0" />
            O Prisma não edita chamados. Use o Jira para atualizar status, adicionar comentários e resolver.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: AI Analysis */}
        <div className="space-y-4">
          {/* Gauge */}
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center">
            <svg width="180" height="100" viewBox="0 0 180 100">
              <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
              <path
                d="M 10 90 A 80 80 0 0 1 170 90"
                fill="none"
                stroke={priorityBarColor(c.priorityLevel)}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(c.aggregatePriorityScore / 100) * 251.2} 251.2`}
              />
              <text x="90" y="80" textAnchor="middle" fill="#F1F5F9" fontSize="32" fontFamily="JetBrains Mono" fontWeight="bold">
                {c.aggregatePriorityScore}
              </text>
              <text x="90" y="95" textAnchor="middle" fill="#94A3B8" fontSize="11" fontFamily="DM Sans">
                Priority Score
              </text>
            </svg>
          </div>

          {/* Breakdown */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold">Breakdown das Variáveis</h3>
            {scoreBreakdown.map(s => (
              <div key={s.key} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground w-3">{s.key}</span>
                <span className="text-xs text-muted-foreground w-24">{s.label} ({s.weight})</span>
                <div className="flex-1 h-2.5 bg-accent rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${s.value * 10}%` }} />
                </div>
                <span className="font-mono text-sm font-bold w-8 text-right">{s.value}</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground font-mono mt-3 bg-accent p-2 rounded">{formula}</p>
          </div>

          {/* Override */}
          {c.overrideApplied && (
            <div className="bg-medium/10 border border-medium/30 rounded-xl p-4 flex items-center gap-2 text-sm text-medium">
              <Zap className="w-4 h-4 shrink-0" />
              Override manual aplicado — score original pode diferir
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold">Override Manual</h3>
            <div className="space-y-2">
              <input
                type="number"
                min={0}
                max={100}
                value={overrideScore}
                onChange={e => setOverrideScore(e.target.value)}
                placeholder="Novo score (0–100)"
                className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
              <textarea
                value={overrideJustification}
                onChange={e => setOverrideJustification(e.target.value)}
                placeholder="Justificativa do override..."
                className="w-full h-20 bg-accent border border-border rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={() => {
                  if (!overrideScore || !overrideJustification) return;
                  overrideMutation.mutate({
                    id: c.id,
                    priorityLevel: Number(overrideScore) >= 80 ? 'CRITICAL' : Number(overrideScore) >= 60 ? 'HIGH' : Number(overrideScore) >= 30 ? 'MEDIUM' : 'LOW',
                    reason: overrideJustification,
                    adjustedBy: 'manual',
                  });
                }}
                className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg hover:opacity-90"
              >
                Salvar override
              </button>
            </div>
          </div>
        </div>

        {/* Right: Timeline */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Timeline de Feedbacks</h3>
              <button
                onClick={() => exportToCsv(`feedbacks_${c.id}.csv`, feedbacks.map(f => ({
                  id: f.id, fonte: f.source, grupo: f.groupName,
                  texto: f.rawText, score: f.priorityScore, recebido: f.receivedAt,
                  jira: f.jiraKey || '',
                })))}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> CSV
              </button>
            </div>

            <div className="space-y-3">
              {feedbacks.map((f, i) => (
                <div key={f.id} className="border-l-2 border-border pl-4 pb-3 relative">
                  <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-card border-2 border-border" />
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className={f.source === 'WHATSAPP' ? 'text-whatsapp' : 'text-jira'}>
                      {f.source === 'WHATSAPP' ? '💬 WhatsApp' : '🔵 Jira'}
                    </span>
                    <span className="text-muted-foreground">
                      {format(new Date(f.receivedAt), "HH:mm · dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    {i === 0 && (
                      <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">⚡ Gerou o cluster</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{f.groupName}</p>
                  <p className="text-sm">{f.rawText}</p>
                  {f.jiraKey && (
                    <a href={f.jiraUrl!} target="_blank" rel="noopener noreferrer" className="text-xs text-jira hover:underline mt-1 inline-block">
                      {f.jiraKey} ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
