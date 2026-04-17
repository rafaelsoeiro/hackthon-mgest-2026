import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportToCsv } from '@/utils/exportCsv';
import { Download, Loader2, Filter } from 'lucide-react';
import { useHeatmapCells } from '@/hooks/use-api';
import { systemLabel } from '@/utils/helpers';
import type { SystemCode, HeatmapCell } from '@/types/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SYSTEM_OPTIONS: (SystemCode | 'ALL')[] = ['ALL', 'GM_CORE', 'GM_SUITE', 'GM_FIN', 'GM_LOG', 'GM_INFRA'];

function getCellColor(count: number): string {
  if (count === 0) return 'bg-white dark:bg-zinc-900';
  if (count <= 5) return 'bg-yellow-200 dark:bg-yellow-900/60';
  if (count <= 15) return 'bg-orange-400 dark:bg-orange-700/80';
  return 'bg-red-500 dark:bg-red-700';
}

function getCellTextColor(count: number): string {
  if (count === 0) return 'text-muted-foreground/40';
  if (count <= 5) return 'text-yellow-900 dark:text-yellow-100';
  if (count <= 15) return 'text-orange-900 dark:text-orange-100';
  return 'text-white';
}

function getRiskLabel(hour: number): { label: string; borderClass: string } | null {
  if (hour >= 0 && hour <= 5) return { label: '⚠️ Janela Crítica', borderClass: 'ring-2 ring-blue-500/60' };
  if (hour >= 5 && hour <= 8) return { label: '🏪 Abertura Lojas', borderClass: 'ring-1 ring-cyan-400/40' };
  return null;
}

export default function HeatmapPage() {
  const [systemCode, setSystemCode] = useState<SystemCode | 'ALL'>('ALL');
  const navigate = useNavigate();

  const { data: heatmapData, isLoading } = useHeatmapCells(
    30,
    systemCode === 'ALL' ? undefined : systemCode,
  );
  const cells = heatmapData ?? [];

  const cellMap = useMemo(() => {
    const m = new Map<string, HeatmapCell>();
    cells.forEach((c) => m.set(`${c.dayOfWeek}-${c.hour}`, c));
    return m;
  }, [cells]);

  const insights = useMemo(() => {
    if (!cells.length) return { peakCell: null, nightTotal: 0, morningTotal: 0 };
    const peakCell = cells.reduce((a, b) => (b.count > a.count ? b : a));
    const nightTotal = cells.filter((c) => c.hour >= 0 && c.hour <= 5).reduce((s, c) => s + c.count, 0);
    const morningTotal = cells.filter((c) => c.hour >= 5 && c.hour <= 8).reduce((s, c) => s + c.count, 0);
    return { peakCell, nightTotal, morningTotal };
  }, [cells]);

  const handleCellClick = useCallback(
    (dayOfWeek: number, hour: number) => {
      navigate(`/queue?hour=${hour}&dayOfWeek=${dayOfWeek}`);
    },
    [navigate],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mapa de Calor — Incidentes por Hora/Dia</h1>
          <p className="text-sm text-muted-foreground">Últimos 30 dias · Atualiza a cada 5 min</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={systemCode} onValueChange={(v) => setSystemCode(v as SystemCode | 'ALL')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sistema" />
              </SelectTrigger>
              <SelectContent>
                {SYSTEM_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'ALL' ? 'Todos os Sistemas' : systemLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            onClick={() =>
              exportToCsv(
                'heatmap_icf.csv',
                cells.map((c) => ({
                  dia: c.day,
                  hora: c.hour,
                  incidentes: c.count,
                  ps_medio: c.averagePriorityScore,
                })),
              )
            }
            className="flex items-center gap-2 bg-accent border border-border text-sm px-4 py-2 rounded-lg hover:bg-accent/80 text-foreground"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Heatmap Grid 7×24 */}
      <div className="bg-card border border-border rounded-xl p-6 overflow-x-auto">
        <div
          className="grid gap-[3px]"
          style={{ gridTemplateColumns: '60px repeat(24, minmax(28px, 1fr))' }}
        >
          {/* Header row — hours */}
          <div />
          {HOURS.map((h) => {
            const risk = getRiskLabel(h);
            return (
              <div
                key={h}
                className={`text-center text-[10px] font-mono text-muted-foreground pb-1 ${
                  risk ? 'font-bold' : ''
                }`}
              >
                {String(h).padStart(2, '0')}
              </div>
            );
          })}

          {/* Data rows */}
          {DAYS.map((day, dayIdx) => (
            <>
              <div key={`label-${day}`} className="text-xs text-muted-foreground flex items-center font-medium">
                {day}
              </div>
              {HOURS.map((hour) => {
                const cell = cellMap.get(`${dayIdx}-${hour}`);
                const count = cell?.count ?? 0;
                const avgPS = cell?.averagePriorityScore ?? 0;
                const risk = getRiskLabel(hour);

                return (
                  <Tooltip key={`${day}-${hour}`}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleCellClick(dayIdx, hour)}
                        className={`aspect-square rounded-sm ${getCellColor(count)} ${
                          risk?.borderClass ?? ''
                        } cursor-pointer transition-all hover:scale-110 hover:z-10 flex items-center justify-center`}
                      >
                        {count > 0 && (
                          <span className={`text-[9px] font-mono font-bold ${getCellTextColor(count)}`}>
                            {count}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-sm">
                      <p className="font-bold">
                        {count} incidente{count !== 1 ? 's' : ''} | PS médio: {avgPS.toFixed(1)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {day} · {String(hour).padStart(2, '0')}h00
                      </p>
                      {risk && (
                        <p className="text-xs text-blue-400 mt-1">{risk.label}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </>
          ))}
        </div>

        {/* Risk window annotations */}
        <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-sm ring-2 ring-blue-500/60 bg-accent" />
            ⚠️ Janela Crítica (00h–05h)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-sm ring-1 ring-cyan-400/40 bg-accent" />
            🏪 Abertura Lojas (05h–08h)
          </span>
        </div>

        {/* Color legend */}
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>0</span>
          <div className="w-5 h-4 rounded-sm bg-white dark:bg-zinc-900 border border-border" />
          <span>1–5</span>
          <div className="w-5 h-4 rounded-sm bg-yellow-200 dark:bg-yellow-900/60" />
          <span>6–15</span>
          <div className="w-5 h-4 rounded-sm bg-orange-400 dark:bg-orange-700/80" />
          <span>16+</span>
          <div className="w-5 h-4 rounded-sm bg-red-500 dark:bg-red-700" />
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Pico absoluto</p>
          <p className="font-mono text-lg font-bold">
            {insights.peakCell?.count ?? 0} incidentes
          </p>
          <p className="text-sm text-muted-foreground">
            {insights.peakCell?.day ?? '-'} · {String(insights.peakCell?.hour ?? 0).padStart(2, '0')}h
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-blue-400">⚠️</span>
            <p className="text-xs text-muted-foreground">Janela Crítica (00–05h)</p>
          </div>
          <p className="font-mono text-lg font-bold">{insights.nightTotal}</p>
          <p className="text-sm text-muted-foreground">incidentes no período</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-1 mb-1">
            <span>🏪</span>
            <p className="text-xs text-muted-foreground">Abertura Lojas (05–08h)</p>
          </div>
          <p className="font-mono text-lg font-bold">{insights.morningTotal}</p>
          <p className="text-sm text-muted-foreground">incidentes no período</p>
        </div>
      </div>
    </div>
  );
}
