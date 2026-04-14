import { useMemo, useState } from 'react';
import { exportToCsv } from '@/utils/exportCsv';
import { Download, AlertTriangle, Loader2 } from 'lucide-react';
import { useHeatmap } from '@/hooks/use-api';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getColor(count: number, max: number) {
  const ratio = count / max;
  if (ratio < 0.15) return 'bg-accent';
  if (ratio < 0.3) return 'bg-primary/30';
  if (ratio < 0.5) return 'bg-primary/50';
  if (ratio < 0.7) return 'bg-medium/60';
  if (ratio < 0.85) return 'bg-high/70';
  return 'bg-critical/80';
}

export default function HeatmapPage() {
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number; count: number } | null>(null);
  const { data: heatmapData, isLoading } = useHeatmap('7d');
  const mockHeatmap = heatmapData ?? [];

  const maxCount = useMemo(() => mockHeatmap.length ? Math.max(...mockHeatmap.map(h => h.count)) : 1, [mockHeatmap]);
  const heatmapMap = useMemo(() => {
    const m = new Map<string, number>();
    mockHeatmap.forEach(h => m.set(`${h.day}-${h.hour}`, h.count));
    return m;
  }, [mockHeatmap]);

  const insights = useMemo(() => {
    if (!mockHeatmap.length) return { peakHour: { day: '-', hour: 0, count: 0 }, nightTotal: 0, morningTotal: 0 };
    const peakHour = mockHeatmap.reduce((a, b) => (b.count > a.count ? b : a));
    const nightTotal = mockHeatmap.filter(h => h.hour >= 0 && h.hour <= 5).reduce((s, h) => s + h.count, 0);
    const morningTotal = mockHeatmap.filter(h => h.hour >= 7 && h.hour <= 10).reduce((s, h) => s + h.count, 0);
    return { peakHour, nightTotal, morningTotal };
  }, [mockHeatmap]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mapa de Calor — Incidentes por Hora/Dia</h1>
        <button
          onClick={() => exportToCsv('heatmap_icf.csv', mockHeatmap.map(h => ({ dia: h.day, hora: h.hour, incidentes: h.count })))}
          className="flex items-center gap-2 bg-accent border border-border text-sm px-4 py-2 rounded-lg hover:bg-accent/80 text-foreground"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Heatmap grid */}
      <div className="bg-card border border-border rounded-xl p-6 overflow-x-auto relative">
        <div className="grid gap-1" style={{ gridTemplateColumns: '60px repeat(24, 1fr)' }}>
          {/* Header row */}
          <div />
          {HOURS.map(h => (
            <div key={h} className="text-center text-[10px] font-mono text-muted-foreground pb-1">
              {String(h).padStart(2, '0')}
            </div>
          ))}

          {/* Data rows */}
          {DAYS.map(day => (
            <>
              <div key={`label-${day}`} className="text-xs text-muted-foreground flex items-center font-medium">
                {day}
              </div>
              {HOURS.map(hour => {
                const count = heatmapMap.get(`${day}-${hour}`) || 0;
                const isRiskWindow = hour >= 0 && hour <= 5;
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`aspect-square rounded-sm ${getColor(count, maxCount)} ${
                      isRiskWindow ? 'border border-dashed border-medium/50' : ''
                    } cursor-pointer transition-transform hover:scale-110 relative`}
                    onMouseEnter={() => setHoveredCell({ day, hour, count })}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                );
              })}
            </>
          ))}
        </div>

        {/* Tooltip */}
        {hoveredCell && (
          <div className="fixed pointer-events-none z-50 bg-popover border border-border rounded-lg px-3 py-2 text-sm shadow-xl"
               style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <span className="font-mono font-bold">{hoveredCell.count}</span> incidentes ·{' '}
            <span className="text-muted-foreground">{hoveredCell.day} · {String(hoveredCell.hour).padStart(2, '0')}h00</span>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <span>Menos</span>
          <div className="flex gap-0.5">
            {['bg-accent', 'bg-primary/30', 'bg-primary/50', 'bg-medium/60', 'bg-high/70', 'bg-critical/80'].map(c => (
              <div key={c} className={`w-4 h-4 rounded-sm ${c}`} />
            ))}
          </div>
          <span>Mais</span>
          <span className="ml-4 flex items-center gap-1">
            <span className="w-4 h-4 rounded-sm border border-dashed border-medium/50" />
            Janela de risco (00h–05h)
          </span>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Pico absoluto</p>
          <p className="font-mono text-lg font-bold">{insights.peakHour.count} incidentes</p>
          <p className="text-sm text-muted-foreground">{insights.peakHour.day} · {String(insights.peakHour.hour).padStart(2, '0')}h</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3 h-3 text-medium" />
            <p className="text-xs text-muted-foreground">Carga noturna (00–05h)</p>
          </div>
          <p className="font-mono text-lg font-bold">{insights.nightTotal}</p>
          <p className="text-sm text-muted-foreground">incidentes na semana</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Pico manhã (07–10h)</p>
          <p className="font-mono text-lg font-bold">{insights.morningTotal}</p>
          <p className="text-sm text-muted-foreground">incidentes na semana</p>
        </div>
      </div>
    </div>
  );
}
