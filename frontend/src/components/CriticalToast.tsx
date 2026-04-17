import { useEffect } from 'react';
import { toast } from 'sonner';
import { useSSE, type ICFEvent } from '@/contexts/SSEContext';

export function CriticalToast() {
  const { onEvent } = useSSE();

  useEffect(() => {
    return onEvent((event: ICFEvent) => {
      if (
        event.type === 'new_incident' &&
        event.payload.priorityLevel === 'CRITICAL'
      ) {
        toast.error(
          `🔴 Incidente CRÍTICO: ${event.payload.title ?? 'Novo incidente detectado'}`,
          {
            duration: Infinity,
            important: true,
            description: event.payload.systemCode
              ? `Sistema: ${event.payload.systemCode}`
              : undefined,
            action: event.payload.id
              ? {
                  label: 'Ver detalhes',
                  onClick: () => {
                    window.location.href = `/incident/${event.payload.id}`;
                  },
                }
              : undefined,
          },
        );
      }
    });
  }, [onEvent]);

  return null;
}
