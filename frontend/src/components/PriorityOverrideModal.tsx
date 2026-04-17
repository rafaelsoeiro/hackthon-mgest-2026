import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { usePriorityOverrideMutation } from '@/hooks/use-api';
import type { PriorityLevel } from '@/types/api';

interface PriorityOverrideModalProps {
  incidentId: string | null;
  currentLevel: PriorityLevel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PriorityOverrideModal({
  incidentId,
  currentLevel,
  open,
  onOpenChange,
}: PriorityOverrideModalProps) {
  const [level, setLevel] = useState<PriorityLevel | ''>('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const mutation = usePriorityOverrideMutation();

  const handleSubmit = () => {
    if (!level) {
      setError('Selecione um nível de prioridade');
      return;
    }
    if (reason.length < 10) {
      setError('A justificativa deve ter no mínimo 10 caracteres');
      return;
    }
    if (!incidentId) return;

    setError('');
    mutation.mutate(
      { id: incidentId, priorityLevel: level, reason },
      {
        onSuccess: () => {
          setLevel('');
          setReason('');
          onOpenChange(false);
        },
      },
    );
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setLevel('');
      setReason('');
      setError('');
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajuste Manual de Prioridade</DialogTitle>
          <DialogDescription>
            Prioridade atual: <strong>{currentLevel ?? '—'}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Novo nível de prioridade</Label>
            <Select value={level} onValueChange={(v) => setLevel(v as PriorityLevel)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CRITICAL">🔴 CRITICAL</SelectItem>
                <SelectItem value="HIGH">🟠 HIGH</SelectItem>
                <SelectItem value="MEDIUM">🟡 MEDIUM</SelectItem>
                <SelectItem value="LOW">🟢 LOW</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Justificativa{' '}
              <span className="text-xs text-muted-foreground">(mín. 10 caracteres)</span>
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.length >= 10) setError('');
              }}
              placeholder="Explique o motivo do ajuste..."
              className="h-24 resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{reason.length}/10</p>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : 'Salvar Override'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
