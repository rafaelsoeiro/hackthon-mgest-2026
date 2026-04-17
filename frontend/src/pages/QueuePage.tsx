import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, ChevronLeft, ChevronRight, Zap, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePriorityQueue } from '@/hooks/use-api';
import { useSSE, type ICFEvent } from '@/contexts/SSEContext';
import { priorityColor, priorityEmoji, systemLabel, statusLabel } from '@/utils/helpers';
import { IncidentDrawer } from '@/components/IncidentDrawer';
import { PriorityOverrideModal } from '@/components/PriorityOverrideModal';
import type { PriorityLevel, QueueIncident } from '@/types/api';

const SYSTEM_OPTIONS = [
  { value: 'GM_CORE', label: 'GM Core' },
  { value: 'GM_SUITE', label: 'GM Suite' },
  { value: 'GM_FIN', label: 'Financeiro' },
  { value: 'GM_LOG', label: 'Logística' },
  { value: 'GM_INFRA', label: 'Infra' },
  { value: 'GM_OTHER', label: 'Outros' },
];

const PRIORITY_OPTIONS = [
  { value: 'CRITICAL', label: '🔴 Critical' },
  { value: 'HIGH', label: '🟠 High' },
  { value: 'MEDIUM', label: '🟡 Medium' },
  { value: 'LOW', label: '🟢 Low' },
];

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Aberto' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'RESOLVED', label: 'Resolvido' },
];

export default function QueuePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [sseIncidents, setSseIncidents] = useState<QueueIncident[]>([]);

  // Drawer & Override modal state
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [overrideLevel, setOverrideLevel] = useState<PriorityLevel | null>(null);

  // Read filters from URL
  const systemCode = searchParams.get('systemCode') ?? '';
  const priorityLevel = searchParams.get('priorityLevel') ?? '';
  const status = searchParams.get('status') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const { data, isLoading, refetch } = usePriorityQueue({
    systemCode: systemCode || undefined,
    priorityLevel: priorityLevel || undefined,
    status: status || undefined,
    page,
    limit: 20,
  });

  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  // Filter setters that persist in URL
  const setFilter = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        next.set('page', '1');
        return next;
      });
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (p: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(p));
        return next;
      });
    },
    [setSearchParams],
  );

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasFilters = systemCode || priorityLevel || status;

  // SSE: listen for new_incident CRITICAL → flash + prepend
  const { onEvent } = useSSE();

  useEffect(() => {
    const unsub = onEvent((evt: ICFEvent) => {
      if (evt.type === 'new_incident' && evt.payload.priorityLevel === 'CRITICAL') {
        const id = evt.payload.incidentGroupId as string;

        // Flash red for 3s
        setFlashIds((prev) => new Set(prev).add(id));
        setTimeout(() => {
          setFlashIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 3000);

        // Add to SSE-injected list at top
        setSseIncidents((prev) => {
          if (prev.find((i) => i.id === id)) return prev;
          return [
            {
              id,
              title: (evt.payload.title as string) ?? 'Novo incidente CRITICAL',
              systemCode: evt.payload.systemCode as any,
              status: 'OPEN',
              priorityScore: evt.payload.priorityScore as number,
              priorityLevel: 'CRITICAL',
              feedbackCount: 1,
              recurrenceCount: 0,
              firstSeenAt: evt.timestamp,
              lastSeenAt: evt.timestamp,
              overrideApplied: false,
              topKeywords: [],
            },
            ...prev,
          ];
        });

        // Also refetch from server to get complete data
        refetch();
      }
    });
    return unsub;
  }, [onEvent, refetch]);

  // Merge SSE-injected incidents with server data (dedup)
  const serverIds = new Set(items.map((i) => i.id));
  const mergedItems = [
    ...sseIncidents.filter((i) => !serverIds.has(i.id)),
    ...items,
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fila de Prioridade</h1>
        <p className="text-sm text-muted-foreground">
          {total} incidente{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={systemCode} onValueChange={(v) => setFilter('systemCode', v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sistema" />
          </SelectTrigger>
          <SelectContent>
            {SYSTEM_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityLevel} onValueChange={(v) => setFilter('priorityLevel', v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => setFilter('status', v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="w-3 h-3 mr-1" /> Limpar Filtros
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Prioridade</TableHead>
              <TableHead>Título / Sistema</TableHead>
              <TableHead className="w-20">Relatos</TableHead>
              <TableHead className="w-24">Recorrência</TableHead>
              <TableHead className="w-32">Detectado</TableHead>
              <TableHead className="w-20">Override</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : mergedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  Nenhum incidente encontrado com esses filtros.
                </TableCell>
              </TableRow>
            ) : (
              mergedItems.map((item) => (
                <TableRow
                  key={item.id}
                  className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                    flashIds.has(item.id)
                      ? 'animate-pulse bg-red-500/20 border-l-4 border-red-500'
                      : ''
                  }`}
                  onClick={() => setDrawerId(item.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge className={`${priorityColor(item.priorityLevel)} text-xs`}>
                        {priorityEmoji(item.priorityLevel)} {item.priorityScore}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium truncate max-w-xs">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{systemLabel(item.systemCode)}</p>
                      {Array.isArray(item.topKeywords) && item.topKeywords.length > 0 && (
                        <div className="flex gap-1 mt-0.5">
                          {item.topKeywords.slice(0, 3).map((kw, idx) => {
                            if (typeof kw === 'string') {
                              return (
                                <span key={kw} className="text-[10px] bg-accent px-1.5 py-0.5 rounded text-muted-foreground">
                                  {kw}
                                </span>
                              );
                            } else if (kw && typeof kw === 'object' && 'keyword' in kw) {
                              return (
                                <span key={kw.keyword || idx} className="text-[10px] bg-accent px-1.5 py-0.5 rounded text-muted-foreground">
                                  {kw.keyword}
                                  {typeof kw.count === 'number' ? ` (${kw.count})` : ''}
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{item.feedbackCount}</span>
                  </TableCell>
                  <TableCell>
                    {item.recurrenceCount > 0 ? (
                      <span className="text-xs text-orange-500 font-medium">
                        {item.recurrenceCount}× recorrente
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.firstSeenAt), { addSuffix: true, locale: ptBR })}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.overrideApplied ? (
                      <Zap className="w-4 h-4 text-orange-500" />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOverrideId(item.id);
                        setOverrideLevel(item.priorityLevel);
                      }}
                    >
                      Ajustar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(p)}
                  className="w-8"
                >
                  {p}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Drawer */}
      <IncidentDrawer
        incidentId={drawerId}
        open={!!drawerId}
        onOpenChange={(open) => { if (!open) setDrawerId(null); }}
        onOverride={(id, level) => {
          setOverrideId(id);
          setOverrideLevel(level);
        }}
      />

      {/* Override Modal */}
      <PriorityOverrideModal
        incidentId={overrideId}
        currentLevel={overrideLevel}
        open={!!overrideId}
        onOpenChange={(open) => { if (!open) { setOverrideId(null); setOverrideLevel(null); } }}
      />
    </div>
  );
}
