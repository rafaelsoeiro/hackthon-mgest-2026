import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Radio, FlaskConical, Loader2, Zap, RefreshCw } from 'lucide-react';
import { useFilters } from '@/contexts/FilterContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SystemCode } from '@/types/api';
import { priorityColor, priorityEmoji, systemLabel } from '@/utils/helpers';
import type { PriorityLevel } from '@/types/api';

const systemOptions: { value: SystemCode | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos os sistemas' },
  { value: 'GM_CORE', label: 'GM Core' },
  { value: 'GM_SUITE', label: 'GM Suite' },
  { value: 'LOGISTICA_CD', label: 'Logística/CD' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'INFRA', label: 'Infra / BD' },
  { value: 'OUTRO', label: 'Outros' },
];

const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/heatmap': 'Mapa de Calor',
  '/sistemas': 'Saúde dos Sistemas',
  '/clusters': 'Agrupamento por IA',
  '/problemas': 'Problemas Estruturais',
};

const CRITICAL_KEYWORDS = ['caiu', 'parou', 'fora do ar', 'urgente', 'emergência', 'crítico', 'bloqueado', 'travou'];

export function AppHeader() {
  const { systemFilter, setSystemFilter } = useFilters();
  const location = useLocation();
  const [countdown, setCountdown] = useState(30);
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const syncJira = useMutation({
    mutationFn: () => api('/ingestion/sync-jira', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => (c <= 1 ? 30 : c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const pageName = pageNames[location.pathname] || 'Prisma';

  return (
    <>
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-sm">Prisma</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground">{pageName}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Radio className="w-3 h-3 text-low" />
            <span>81 grupos WA + Jira · Atualizado há <span className="font-mono text-foreground">{countdown}s</span></span>
          </div>

          <select
            value={systemFilter}
            onChange={e => setSystemFilter(e.target.value as SystemCode | 'ALL')}
            className="bg-accent border border-border text-sm text-foreground rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-ring"
          >
            {systemOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={() => syncJira.mutate()}
            disabled={syncJira.isPending}
            className="flex items-center gap-2 bg-accent border border-border text-sm text-foreground px-3 py-1.5 rounded-md hover:bg-accent/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncJira.isPending ? 'animate-spin' : ''}`} />
            {syncJira.isPending ? 'Sincronizando...' : 'Sync Jira'}
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground text-sm px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
          >
            <FlaskConical className="w-4 h-4" />
            Simular IA
          </button>
        </div>
      </header>
      {showModal && <AISimulationModal onClose={() => setShowModal(false)} />}
    </>
  );
}

function AISimulationModal({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    system: string; severity: number; type: string;
    S: number; V: number; R: number; T: number; K: number;
    ps: number; level: PriorityLevel; override: boolean;
  }>(null);

  const analyze = useCallback(() => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const hasKeyword = CRITICAL_KEYWORDS.some(k => text.toLowerCase().includes(k));
      const S = hasKeyword ? 9 + Math.random() : 3 + Math.random() * 5;
      const V = 1 + Math.random() * 8;
      const R = Math.random() * 8;
      const T = 2 + Math.random() * 7;
      const K = hasKeyword ? 9 + Math.random() : Math.random() * 5;
      let ps = Math.round(((S * 0.35) + (V * 0.25) + (R * 0.20) + (T * 0.10) + (K * 0.10)) * 10);
      if (hasKeyword) ps = 100;
      const level: PriorityLevel = ps >= 75 ? 'CRITICAL' : ps >= 50 ? 'HIGH' : ps >= 25 ? 'MEDIUM' : 'LOW';
      const systems = ['GM Core', 'GM Suite', 'Logística/CD', 'Financeiro', 'Infra / BD'];
      setResult({
        system: systems[Math.floor(Math.random() * systems.length)],
        severity: +S.toFixed(1), type: S > 6 ? 'Incidente' : S > 3 ? 'Dúvida' : 'Melhoria',
        S: +S.toFixed(1), V: +V.toFixed(1), R: +R.toFixed(1), T: +T.toFixed(1), K: +K.toFixed(1),
        ps, level, override: hasKeyword,
      });
      setLoading(false);
    }, 1500);
  }, [text]);

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          Simular Análise de IA
        </h2>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Cole uma mensagem do WhatsApp ou descrição do Jira..."
          className="w-full h-28 bg-accent border border-border rounded-lg p-3 text-sm text-foreground resize-none outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          onClick={analyze}
          disabled={loading || !text.trim()}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando IA...</> : 'Analisar'}
        </button>
        {loading && (
          <div className="space-y-2">
            <div className="h-2 bg-accent rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
            <p className="text-xs text-muted-foreground text-center">Classificando severidade e sistema...</p>
          </div>
        )}
        {result && (
          <div className="space-y-3 border-t border-border pt-4">
            {result.override && (
              <div className="bg-medium/20 border border-medium rounded-lg p-3 flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-medium" />
                <span className="text-medium font-medium">Override aplicado — PS forçado a 100</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Sistema detectado</p>
                <p className="font-medium">{result.system}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="font-medium">{result.type}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Priority Score</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-2xl font-bold">{result.ps}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor(result.level)}`}>
                    {priorityEmoji(result.level)} {result.level}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {([['S', 'Severidade', result.S], ['V', 'Volume', result.V], ['R', 'Recorrência', result.R], ['T', 'Temporal', result.T], ['K', 'Keywords', result.K]] as [string, string, number][]).map(([k, label, val]) => (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <span className="font-mono w-4 text-muted-foreground">{k}</span>
                  <span className="w-20 text-muted-foreground">{label}</span>
                  <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${val * 10}%` }} />
                  </div>
                  <span className="font-mono w-8 text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Fechar</button>
      </div>
    </div>
  );
}
