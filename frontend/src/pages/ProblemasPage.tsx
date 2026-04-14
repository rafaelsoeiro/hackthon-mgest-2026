import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Area, AreaChart, BarChart, Bar } from 'recharts';
import { exportToCsv } from '@/utils/exportCsv';
import { priorityColor, statusLabel, systemLabel } from '@/utils/helpers';
import { Download, AlertTriangle, ExternalLink, Info, ChevronDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProblems } from '@/hooks/use-api';

const COLORS = ['#DC2626', '#2563EB', '#CA8A04', '#16A34A', '#EA580C'];

export default function ProblemasPage() {
  const [weekRange, setWeekRange] = useState<4 | 8 | 12>(12);
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [squadDropdown, setSquadDropdown] = useState<string | null>(null);

  const { data: allProblems, isLoading } = useProblems();
  const mockProblems = allProblems ?? [];

  const problems = showOnlyOpen
    ? mockProblems.filter(p => p.status !== 'RESOLVED')
    : mockProblems;

  const unassigned = mockProblems.filter(p => p.squadOwner === 'Nao atribuido').length;
  const trending = mockProblems.filter(p => {
    const s = p.recurrenceSeries;
    return s.length >= 3 && s[s.length - 1].count > s[s.length - 3].count;
  }).length;

  // Line chart data
  const chartData = useMemo(() => {
    const allDates = new Set<string>();
    problems.forEach(p => p.recurrenceSeries.slice(-weekRange).forEach(r => allDates.add(r.date)));
    const sorted = [...allDates].sort();
    return sorted.map(date => {
      const point: Record<string, unknown> = { date };
      problems.forEach(p => {
        const found = p.recurrenceSeries.find(r => r.date === date);
        point[p.id] = found ? found.count : 0;
      });
      return point;
    });
  }, [problems, weekRange]);

  // Bar chart data
  const barData = useMemo(() => {
    const systemMap = new Map<string, number>();
    mockProblems.forEach(p => {
      const sys = systemLabel(p.systemCode);
      systemMap.set(sys, (systemMap.get(sys) || 0) + p.occurrenceCount);
    });
    return [...systemMap.entries()].map(([system, total]) => ({ system, total }));
  }, [mockProblems]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const exportAllProblems = () => {
    exportToCsv('problemas_icf.csv', mockProblems.map(p => ({
      id: p.id, titulo: p.title, sistema: systemLabel(p.systemCode),
      total_ocorrencias: p.occurrenceCount,
      media_dias_entre_ocorrencias: p.avgDaysBetweenOccurrences,
      horas_paradas_estimadas_total: p.occurrenceCount * p.estimatedCostPerOccurrenceHours,
      primeira_ocorrencia: p.firstOccurredAt, ultima_ocorrencia: p.lastOccurredAt,
      status: p.status, squad: p.squadOwner, jira_epic: p.jiraEpicKey || '',
    })));
  };

  const exportSeries = () => {
    const rows: Record<string, unknown>[] = [];
    mockProblems.forEach(p => {
      p.recurrenceSeries.forEach(r => {
        rows.push({ problema_id: p.id, titulo: p.title, data: r.date, ocorrencias: r.count });
      });
    });
    exportToCsv('recorrencia_icf.csv', rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Problemas Estruturais — Análise de Recorrência</h1>
        </div>
        <button
          onClick={exportAllProblems}
          className="flex items-center gap-2 bg-accent border border-border text-sm px-4 py-2 rounded-lg hover:bg-accent/80 text-foreground"
        >
          <Download className="w-4 h-4" /> Exportar relatório de problemas
        </button>
      </div>

      {/* Alert banner */}
      <div className="bg-high/10 border border-high/30 rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm">
        <AlertTriangle className="w-4 h-4 text-high shrink-0" />
        <span className="text-high">
          ⚠️ {unassigned} problema{unassigned !== 1 ? 's' : ''} sem squad atribuída · {trending} problema{trending !== 1 ? 's' : ''} com tendência crescente
        </span>
      </div>

      {/* 5a. Recurrence Line Chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Gráfico de Recorrência — Série Temporal</h3>
          <div className="flex items-center gap-2">
            {([4, 8, 12] as const).map(w => (
              <button
                key={w}
                onClick={() => setWeekRange(w)}
                className={`text-xs px-3 py-1 rounded-md border ${
                  weekRange === w ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
                }`}
              >
                {w} semanas
              </button>
            ))}
            <button
              onClick={() => setShowOnlyOpen(!showOnlyOpen)}
              className={`text-xs px-3 py-1 rounded-md border ${
                showOnlyOpen ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
              }`}
            >
              {showOnlyOpen ? 'Apenas abertos' : 'Todos'}
            </button>
            <button
              onClick={exportSeries}
              className="text-xs px-3 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> CSV
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData}>
            <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={d => format(new Date(d), 'dd/MM')} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
            <ReferenceLine y={3} stroke="#EA580C" strokeDasharray="6 3" label={{ value: '⚠️ Limiar', fill: '#EA580C', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#F1F5F9', fontSize: 12 }}
              labelFormatter={d => format(new Date(d as string), "dd 'de' MMMM", { locale: ptBR })}
              formatter={(value: number, name: string) => {
                const p = problems.find(pr => pr.id === name);
                return [value, p?.title.slice(0, 40) || name];
              }}
            />
            <Legend
              formatter={(value: string) => {
                const p = problems.find(pr => pr.id === value);
                return p?.title.slice(0, 35) || value;
              }}
              wrapperStyle={{ fontSize: 11 }}
            />
            {/* Area for rp-002 */}
            <Area
              type="monotone"
              dataKey="rp-002"
              fill="#DC2626"
              fillOpacity={0.1}
              stroke="none"
            />
            {problems.map((p, i) => (
              <Line
                key={p.id}
                type="monotone"
                dataKey={p.id}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 5b. Bar Chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold mb-4">Total de Ocorrências por Sistema</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData}>
            <XAxis dataKey="system" tick={{ fill: '#94A3B8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#F1F5F9' }} />
            <Bar dataKey="total" fill="#2563EB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 5c. Problem Cards */}
      <div className="grid grid-cols-2 gap-4">
        {mockProblems.map(p => (
          <div key={p.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  p.status === 'OPEN' ? 'bg-critical/20 text-critical' :
                  p.status === 'IN_INVESTIGATION' ? 'bg-medium/20 text-medium' :
                  'bg-low/20 text-low'
                }`}>
                  {statusLabel(p.status)}
                </span>
                <span className="font-medium text-sm">{p.title}</span>
              </div>
              <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded shrink-0">{systemLabel(p.systemCode)}</span>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <p>🔁 {p.occurrenceCount} ocorrências · Ø {p.avgDaysBetweenOccurrences} dias entre ocorrências</p>
              <p>⏱ ~{p.estimatedCostPerOccurrenceHours}h paradas/ocorrência · ~{p.occurrenceCount * p.estimatedCostPerOccurrenceHours}h no total</p>
              <p>📅 Primeira: {format(new Date(p.firstOccurredAt), 'MMM/yyyy', { locale: ptBR })} → Última: {format(new Date(p.lastOccurredAt), "dd/MMM/yyyy", { locale: ptBR })}</p>
            </div>

            <p className="text-sm">
              <span className="text-muted-foreground">Squad:</span>{' '}
              <span className={p.squadOwner === 'Não atribuído' ? 'text-critical' : 'text-foreground'}>{p.squadOwner}</span>
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              {p.jiraEpicKey ? (
                <a
                  href={p.jiraEpicUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-jira border border-jira/40 rounded-md px-3 py-1.5 hover:bg-jira/10"
                >
                  <span className="w-4 h-4 bg-jira rounded-sm flex items-center justify-center text-[10px] font-bold text-primary-foreground">J</span>
                  {p.jiraEpicKey} — Ver épico no Jira
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground border border-border rounded-md px-3 py-1.5 opacity-50 cursor-not-allowed" title="Crie um épico no Jira e associe aqui via backend">
                  Nenhum épico Jira associado
                </span>
              )}

              <div className="relative">
                <button
                  onClick={() => setSquadDropdown(squadDropdown === p.id ? null : p.id)}
                  className="text-sm text-primary border border-primary/40 rounded-md px-3 py-1.5 hover:bg-primary/10 flex items-center gap-1"
                >
                  Atribuir squad <ChevronDown className="w-3 h-3" />
                </button>
                {squadDropdown === p.id && (
                  <div className="absolute top-full mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 w-48">
                    {['Squad ERP Core', 'Squad Logística', 'Squad Performance', 'Squad Infra / DBA', 'Squad Financeiro'].map(s => (
                      <button
                        key={s}
                        onClick={() => setSquadDropdown(null)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent text-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {p.jiraEpicKey && (
                <div className="group relative">
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  <div className="absolute bottom-full mb-2 left-0 hidden group-hover:block bg-popover border border-border rounded-lg p-3 text-xs text-muted-foreground w-64 shadow-xl z-50">
                    O Prisma detecta automaticamente este problema recorrente. O épico no Jira é criado pela equipe e associado via backend — o Prisma redireciona para acompanhamento.
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
