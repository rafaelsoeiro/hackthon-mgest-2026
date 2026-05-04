import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { exportToCsv } from '@/utils/exportCsv';
import { Download, Loader2 } from 'lucide-react';
import { useSystemMetrics } from '@/hooks/use-api';
import { systemLabel } from '@/utils/helpers';

export default function SistemasPage() {
  const { data: metrics, isLoading } = useSystemMetrics();

  const mockSystemMetrics = (metrics ?? []).map(m => ({ ...m, system: systemLabel(m.code) }));

  const radarData = mockSystemMetrics
    .filter(s => s.code !== 'GM_OTHER')
    .map(s => ({
      system: s.system,
      critical: s.critical,
      total: s.total,
    }));

  const healthScores = mockSystemMetrics.map(s => {
    const score = Math.max(0, 100 - (s.critical * 10 + s.high * 5 + s.medium * 2 + s.low));
    return { ...s, healthScore: score };
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Saúde dos Sistemas</h1>
        <button
          onClick={() => exportToCsv('sistemas_icf.csv', healthScores.map(s => ({
            sistema: s.system, total: s.total, critico: s.critical,
            alto: s.high, medio: s.medium, baixo: s.low, score_saude: s.healthScore,
          })))}
          className="flex items-center gap-2 bg-accent border border-border text-sm px-4 py-2 rounded-lg hover:bg-accent/80 text-foreground"
        >
          <Download className="w-4 h-4" />
          Exportar Relatório
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Stacked Bar Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">Incidentes por Sistema e Severidade</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockSystemMetrics} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis type="category" dataKey="system" tick={{ fill: '#94A3B8', fontSize: 12 }} width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#F1F5F9' }}
              />
              <Bar dataKey="critical" stackId="a" fill="#DC2626" name="Crítico" radius={[0, 0, 0, 0]} />
              <Bar dataKey="high" stackId="a" fill="#EA580C" name="Alto" />
              <Bar dataKey="medium" stackId="a" fill="#CA8A04" name="Médio" />
              <Bar dataKey="low" stackId="a" fill="#16A34A" name="Baixo" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">Radar — Críticos vs Volume Total</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="system" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <Radar name="Críticos" dataKey="critical" stroke="#DC2626" fill="#DC2626" fillOpacity={0.3} />
              <Radar name="Volume total" dataKey="total" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Health Cards */}
      <div className="grid grid-cols-3 gap-4">
        {healthScores.map(s => (
          <div key={s.code} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">{s.system}</h3>
              <span className={`font-mono text-lg font-bold ${
                s.healthScore >= 70 ? 'text-low' : s.healthScore >= 40 ? 'text-medium' : 'text-critical'
              }`}>
                {s.healthScore}
              </span>
            </div>
            <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${s.healthScore}%`,
                  backgroundColor: s.healthScore >= 70 ? '#16A34A' : s.healthScore >= 40 ? '#CA8A04' : '#DC2626',
                }}
              />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
              <div><span className="text-critical font-mono font-bold">{s.critical}</span><br/><span className="text-muted-foreground">Crít</span></div>
              <div><span className="text-high font-mono font-bold">{s.high}</span><br/><span className="text-muted-foreground">Alto</span></div>
              <div><span className="text-medium font-mono font-bold">{s.medium}</span><br/><span className="text-muted-foreground">Méd</span></div>
              <div><span className="text-low font-mono font-bold">{s.low}</span><br/><span className="text-muted-foreground">Baixo</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
