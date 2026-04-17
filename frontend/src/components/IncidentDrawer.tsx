import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExternalLink, Zap, Download } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIncidentDetail } from '@/hooks/use-api';
import { priorityColor, priorityEmoji, priorityBarColor, systemLabel, statusLabel } from '@/utils/helpers';
import type { PriorityLevel } from '@/types/api';

interface IncidentDrawerProps {
  incidentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOverride: (id: string, level: PriorityLevel) => void;
}

export function IncidentDrawer({
  incidentId,
  open,
  onOpenChange,
  onOverride,
}: IncidentDrawerProps) {
  const { data: incident, isLoading } = useIncidentDetail(incidentId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {isLoading ? (
              <DrawerSkeleton />
            ) : incident ? (
              <>
                {/* Header */}
                <SheetHeader className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={priorityColor(incident.priorityLevel)}>
                      {priorityEmoji(incident.priorityLevel)} {incident.priorityLevel}
                    </Badge>
                    <Badge variant="outline">{systemLabel(incident.systemCode)}</Badge>
                    <Badge variant="outline">{statusLabel(incident.status)}</Badge>
                  </div>
                  <SheetTitle className="text-lg">{incident.title}</SheetTitle>
                  <p className="text-sm text-muted-foreground">{incident.summary}</p>
                </SheetHeader>

                {/* PS Breakdown — 5 bars S/V/R/T/K */}
                <div className="bg-accent/50 border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Priority Score</h4>
                    <span
                      className="font-mono text-2xl font-bold"
                      style={{ color: priorityBarColor(incident.priorityLevel) }}
                    >
                      {incident.aggregatePriorityScore}
                    </span>
                  </div>
                  {[
                    { key: 'S', label: 'Severidade (35%)', value: incident.scoreS },
                    { key: 'V', label: 'Volume (25%)', value: incident.scoreV },
                    { key: 'R', label: 'Recorrência (20%)', value: incident.scoreR },
                    { key: 'T', label: 'Temporal (10%)', value: incident.scoreT },
                    { key: 'K', label: 'Keywords (10%)', value: incident.scoreK },
                  ].map((s) => (
                    <div key={s.key} className="flex items-center gap-2">
                      <span className="font-mono text-xs w-3 text-muted-foreground">{s.key}</span>
                      <span className="text-xs text-muted-foreground w-28">{s.label}</span>
                      <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${s.value * 10}%`,
                            backgroundColor: priorityBarColor(incident.priorityLevel),
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold w-6 text-right">{s.value}</span>
                    </div>
                  ))}
                  {incident.overrideApplied && (
                    <div className="flex items-center gap-1.5 text-xs text-orange-500 mt-1">
                      <Zap className="w-3 h-3" /> Override manual aplicado
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOverride(incident.id, incident.priorityLevel)}
                  >
                    Ajustar Prioridade
                  </Button>
                  {incident.jiraKey && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={incident.jiraUrl!} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {incident.jiraKey}
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(
                        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/incidents/${incident.id}/export`,
                        '_blank',
                      );
                    }}
                  >
                    <Download className="w-3 h-3 mr-1" /> Exportar
                  </Button>
                </div>

                <Separator />

                {/* IA Section */}
                {incident.sources && incident.sources.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Fontes</h4>
                    <div className="flex gap-1.5">
                      {incident.sources.map((s) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className={s === 'WHATSAPP' ? 'border-green-500/30 text-green-500' : 'border-blue-500/30 text-blue-500'}
                        >
                          {s === 'WHATSAPP' ? '💬 WhatsApp' : '🔵 Jira'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">
                    Timeline de Feedbacks ({incident.feedbacks?.length ?? 0})
                  </h4>
                  <div className="space-y-3 max-h-72 overflow-auto scrollbar-thin">
                    {(incident.feedbacks ?? []).map((f, i) => (
                      <div key={f.id} className="border-l-2 border-border pl-3 pb-2 relative">
                        <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-card border-2 border-border" />
                        <div className="flex items-center gap-2 text-xs mb-0.5">
                          <span className={f.source === 'WHATSAPP' ? 'text-green-500' : 'text-blue-500'}>
                            {f.source === 'WHATSAPP' ? '💬' : '🔵'} {f.groupName}
                          </span>
                          <span className="text-muted-foreground">
                            {format(new Date(f.receivedAt), "HH:mm · dd/MM", { locale: ptBR })}
                          </span>
                          {i === 0 && (
                            <Badge variant="secondary" className="text-[10px] py-0">1º relato</Badge>
                          )}
                        </div>
                        <p className="text-xs text-foreground/80 line-clamp-2">{f.rawText}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recurrence History */}
                {incident.occurrences && incident.occurrences.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">
                        Histórico de Recorrências ({incident.occurrences.length})
                      </h4>
                      <div className="space-y-1.5">
                        {incident.occurrences.map((o) => (
                          <div
                            key={o.id}
                            className="flex items-center justify-between text-xs bg-accent/50 rounded px-3 py-1.5"
                          >
                            <span>
                              {format(new Date(o.occurredAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                            <span className="font-mono">PS {o.scoreSnapshot}</span>
                            <span className={o.resolvedAt ? 'text-green-500' : 'text-orange-500'}>
                              {o.resolvedAt ? 'Resolvido' : 'Aberto'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Incidente não encontrado.</p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function DrawerSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}
