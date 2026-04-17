import { useState } from 'react';
import { Loader2, Plus, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  useTimeWindows,
  useCreateTimeWindow,
  useDeleteTimeWindow,
  useKeywordRules,
  useCreateKeywordRule,
  useDeleteKeywordRule,
  useWhatsAppGroups,
  useUpdateWhatsAppGroup,
  useTriggerJiraSync,
} from '@/hooks/use-api';
import { systemLabel } from '@/utils/helpers';
import type { SystemCode } from '@/types/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const SYSTEM_OPTIONS: SystemCode[] = ['GM_CORE', 'GM_SUITE', 'GM_FIN', 'GM_LOG', 'GM_INFRA', 'GM_OTHER'];

// ─── Tab 1: Time Windows ────────────────────────────────

function TimeWindowsTab() {
  const { data: windows, isLoading } = useTimeWindows();
  const createMutation = useCreateTimeWindow();
  const deleteMutation = useDeleteTimeWindow();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    startHour: 0,
    startMinute: 0,
    endHour: 0,
    endMinute: 0,
    boost: 10,
    isActive: true,
  });

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(form);
      toast.success('Janela de risco criada com sucesso');
      setShowAdd(false);
      setForm({ name: '', startHour: 0, startMinute: 0, endHour: 0, endMinute: 0, boost: 10, isActive: true });
    } catch {
      toast.error('Erro ao criar janela de risco');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      toast.success('Janela de risco removida');
      setDeleteTarget(null);
    } catch {
      toast.error('Erro ao remover janela de risco');
    }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Janelas de horário com boost automático de prioridade
        </p>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Início</TableHead>
            <TableHead>Fim</TableHead>
            <TableHead>Boost</TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(windows ?? []).map((tw) => (
            <TableRow key={tw.id}>
              <TableCell className="font-medium">{tw.name}</TableCell>
              <TableCell className="font-mono">
                {String(tw.startHour).padStart(2, '0')}:{String(tw.startMinute).padStart(2, '0')}
              </TableCell>
              <TableCell className="font-mono">
                {String(tw.endHour).padStart(2, '0')}:{String(tw.endMinute).padStart(2, '0')}
              </TableCell>
              <TableCell>
                <Badge variant="outline">+{tw.boost}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={tw.isActive ? 'bg-green-600 text-white' : 'bg-zinc-600 text-white'}>
                  {tw.isActive ? 'Sim' : 'Não'}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:text-red-300"
                  onClick={() => setDeleteTarget(tw.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(windows ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                Nenhuma janela de risco cadastrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Janela de Risco</DialogTitle>
            <DialogDescription>Configure uma janela de horário com boost de prioridade</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Carga Noturna"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Hora Início</label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={form.startHour}
                  onChange={(e) => setForm({ ...form, startHour: +e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Minuto Início</label>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={form.startMinute}
                  onChange={(e) => setForm({ ...form, startMinute: +e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Hora Fim</label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={form.endHour}
                  onChange={(e) => setForm({ ...form, endHour: +e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Minuto Fim</label>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={form.endMinute}
                  onChange={(e) => setForm({ ...form, endMinute: +e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Boost de Prioridade</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.boost}
                onChange={(e) => setForm({ ...form, boost: +e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.name || createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover esta janela de risco? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab 2: Keyword Rules ───────────────────────────────

function KeywordRulesTab() {
  const { data: rules, isLoading } = useKeywordRules();
  const createMutation = useCreateKeywordRule();
  const deleteMutation = useDeleteKeywordRule();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({
    pattern: '',
    scoreK: 5,
    forceOverride: false,
    overrideMinPS: null as number | null,
    description: '',
    isActive: true,
  });

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(form);
      toast.success('Regra de keyword criada com sucesso');
      setShowAdd(false);
      setForm({ pattern: '', scoreK: 5, forceOverride: false, overrideMinPS: null, description: '', isActive: true });
    } catch {
      toast.error('Erro ao criar regra de keyword');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      toast.success('Regra de keyword removida');
      setDeleteTarget(null);
    } catch {
      toast.error('Erro ao remover regra de keyword');
    }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Regras de palavras-chave para classificação e override de prioridade
        </p>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Padrão</TableHead>
            <TableHead>Score K</TableHead>
            <TableHead>Force Override</TableHead>
            <TableHead>Min PS Override</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(rules ?? []).map((rule) => (
            <TableRow key={rule.id}>
              <TableCell>
                <code className="bg-accent px-2 py-0.5 rounded text-sm">{rule.pattern}</code>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{rule.scoreK}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={rule.forceOverride ? 'bg-red-600 text-white' : 'bg-zinc-600 text-white'}>
                  {rule.forceOverride ? 'Sim' : 'Não'}
                </Badge>
              </TableCell>
              <TableCell className="font-mono">
                {rule.overrideMinPS ?? '—'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                {rule.description ?? '—'}
              </TableCell>
              <TableCell>
                <Badge className={rule.isActive ? 'bg-green-600 text-white' : 'bg-zinc-600 text-white'}>
                  {rule.isActive ? 'Sim' : 'Não'}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:text-red-300"
                  onClick={() => setDeleteTarget(rule.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(rules ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                Nenhuma regra de keyword cadastrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Regra de Keyword</DialogTitle>
            <DialogDescription>Configure uma regra de palavras-chave para classificação</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="text-sm font-medium">Padrão (regex)</label>
              <Input
                value={form.pattern}
                onChange={(e) => setForm({ ...form, pattern: e.target.value })}
                placeholder="Ex: faturamento|nota fiscal"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Score K</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={form.scoreK}
                  onChange={(e) => setForm({ ...form, scoreK: +e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Min PS Override</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.overrideMinPS ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, overrideMinPS: e.target.value ? +e.target.value : null })
                  }
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex: Regra para faturamento"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.forceOverride}
                onCheckedChange={(v) => setForm({ ...form, forceOverride: v })}
              />
              <label className="text-sm">Force Override</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.pattern || createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover esta regra de keyword? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab 3: WhatsApp Groups ─────────────────────────────

function WhatsAppGroupsTab() {
  const { data: groups, isLoading } = useWhatsAppGroups();
  const updateMutation = useUpdateWhatsAppGroup();

  const handleToggleMonitored = async (id: string, current: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, isMonitored: !current });
      toast.success(`Monitoramento ${!current ? 'ativado' : 'desativado'}`);
    } catch {
      toast.error('Erro ao atualizar grupo');
    }
  };

  const handleSystemChange = async (id: string, value: string) => {
    try {
      await updateMutation.mutateAsync({ id, systemHint: value === 'NONE' ? null : value });
      toast.success('Sistema atualizado');
    } catch {
      toast.error('Erro ao atualizar sistema');
    }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Grupos WhatsApp monitorados · {(groups ?? []).filter((g) => g.isMonitored).length} ativos de {(groups ?? []).length}
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Grupo</TableHead>
            <TableHead>Membros</TableHead>
            <TableHead>Sistema</TableHead>
            <TableHead>Monitorado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(groups ?? []).map((group) => (
            <TableRow key={group.id}>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">{group.groupName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{group.groupId}</p>
                </div>
              </TableCell>
              <TableCell className="font-mono">{group.memberCount ?? '—'}</TableCell>
              <TableCell>
                <Select
                  value={group.systemHint ?? 'NONE'}
                  onValueChange={(v) => handleSystemChange(group.id, v)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Nenhum</SelectItem>
                    {SYSTEM_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {systemLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Switch
                  checked={group.isMonitored}
                  onCheckedChange={() => handleToggleMonitored(group.id, group.isMonitored)}
                />
              </TableCell>
            </TableRow>
          ))}
          {(groups ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                Nenhum grupo WhatsApp encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Tab 4: Sync Status ─────────────────────────────────

function SyncStatusTab() {
  const syncMutation = useTriggerJiraSync();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncMutation.mutateAsync();
      toast.success('Sync Jira disparado com sucesso');
    } catch {
      toast.error('Erro ao disparar sync Jira');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Status de sincronização com Jira e filas BullMQ
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Jira Sync */}
        <div className="bg-accent/30 border border-border rounded-lg p-4 space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Jira Sync
          </h3>
          <p className="text-sm text-muted-foreground">
            Sincronização automática a cada 5 minutos via cron
          </p>
          <Button onClick={handleSync} disabled={syncing} size="sm">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            Sync Manual
          </Button>
        </div>

        {/* BullMQ Stats */}
        <div className="bg-accent/30 border border-border rounded-lg p-4 space-y-3">
          <h3 className="font-medium">📊 BullMQ Counters</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-yellow-400">—</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-blue-400">—</p>
              <p className="text-xs text-muted-foreground">Processing</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-red-400">—</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Settings Page ─────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Gerenciamento de regras, janelas de risco e integrações
        </p>
      </div>

      <Tabs defaultValue="time-windows" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="time-windows">Janelas de Risco</TabsTrigger>
          <TabsTrigger value="keyword-rules">Regras de Keywords</TabsTrigger>
          <TabsTrigger value="whatsapp-groups">Grupos WhatsApp</TabsTrigger>
          <TabsTrigger value="sync-status">Sync Status</TabsTrigger>
        </TabsList>
        <TabsContent value="time-windows" className="mt-4">
          <TimeWindowsTab />
        </TabsContent>
        <TabsContent value="keyword-rules" className="mt-4">
          <KeywordRulesTab />
        </TabsContent>
        <TabsContent value="whatsapp-groups" className="mt-4">
          <WhatsAppGroupsTab />
        </TabsContent>
        <TabsContent value="sync-status" className="mt-4">
          <SyncStatusTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
