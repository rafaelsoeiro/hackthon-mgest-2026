import { useState, useMemo } from 'react';
import { Loader2, ExternalLink, Sparkles, ArrowUpDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRecurrences } from '@/hooks/use-api';
import { systemLabel } from '@/utils/helpers';
import type { RecurrenceIncident } from '@/types/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

function recurrenceBadge(count: number) {
  if (count >= 10) return { emoji: '💀', label: 'Estrutural', color: 'bg-purple-600 text-white' };
  if (count >= 6) return { emoji: '🔴', label: 'Sistêmico', color: 'bg-red-600 text-white' };
  if (count >= 3) return { emoji: '🟠', label: 'Recorrente', color: 'bg-orange-500 text-white' };
  return { emoji: '🟡', label: 'Emergente', color: 'bg-yellow-500 text-black' };
}

function generateEpicDraft(incident: RecurrenceIncident): string {
  return `📋 Épico Sugerido — ${incident.title}

🏷️ Sistema: ${systemLabel(incident.systemCode)}
📊 Recorrências: ${incident.recurrenceCount}
🎯 Priority Score: ${incident.priorityScore}
📅 Primeiro registro: ${new Date(incident.firstSeenAt).toLocaleDateString('pt-BR')}
📅 Último registro: ${new Date(incident.lastSeenAt).toLocaleDateString('pt-BR')}

📝 Descrição:
Incidente recorrente com ${incident.recurrenceCount} ocorrências registradas no sistema ${systemLabel(incident.systemCode)}.
Este padrão sugere a necessidade de uma análise de causa raiz e correção estrutural.

✅ Critérios de Aceite:
- [ ] Causa raiz identificada e documentada
- [ ] Correção implementada em ambiente de homologação
- [ ] Monitoramento configurado para detectar reincidência
- [ ] Validação em produção por 7 dias sem novas ocorrências`;
}

export default function IncidentsRecurrencePage() {
  const { data: recurrences, isLoading } = useRecurrences();
  const [epicDraft, setEpicDraft] = useState<{ incident: RecurrenceIncident; draft: string } | null>(null);
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  const sorted = useMemo(() => {
    if (!recurrences) return [];
    return [...recurrences].sort((a, b) =>
      sortDirection === 'desc'
        ? b.recurrenceCount - a.recurrenceCount
        : a.recurrenceCount - b.recurrenceCount,
    );
  }, [recurrences, sortDirection]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel de Recorrências</h1>
        <p className="text-sm text-muted-foreground">
          Incidentes ordenados por frequência de recorrência · {sorted.length} registros
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Nível</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Sistema</TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => setSortDirection((d) => (d === 'desc' ? 'asc' : 'desc'))}
                >
                  Ocorrências
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>Última Ocorrência</TableHead>
              <TableHead>Épico Jira</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma recorrência encontrada
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((incident) => {
                const badge = recurrenceBadge(incident.recurrenceCount);
                return (
                  <TableRow key={incident.id} className="hover:bg-accent/50">
                    <TableCell>
                      <Badge className={`${badge.color} text-xs`}>
                        {badge.emoji} {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{incident.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          PS: {incident.priorityScore} · {incident.feedbackCount} relato{incident.feedbackCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {systemLabel(incident.systemCode)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-bold text-lg">
                        {incident.recurrenceCount}×
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(incident.lastSeenAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      {incident.epicJiraKey ? (
                        <a
                          href={`https://grupomateus.atlassian.net/browse/${incident.epicJiraKey}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
                        >
                          {incident.epicJiraKey}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() =>
                            setEpicDraft({
                              incident,
                              draft: generateEpicDraft(incident),
                            })
                          }
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Sugerir Épico
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Epic Draft Dialog */}
      <Dialog open={!!epicDraft} onOpenChange={() => setEpicDraft(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Sugestão de Épico Jira
            </DialogTitle>
            <DialogDescription>
              Draft gerado automaticamente para "{epicDraft?.incident.title}"
            </DialogDescription>
          </DialogHeader>
          <pre className="bg-accent/50 border border-border rounded-lg p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed">
            {epicDraft?.draft}
          </pre>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEpicDraft(null)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(epicDraft?.draft ?? '');
                setEpicDraft(null);
              }}
            >
              Copiar para Clipboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
