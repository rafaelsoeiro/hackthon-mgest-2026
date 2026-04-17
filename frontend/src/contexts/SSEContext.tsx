import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

// ── Event types ──────────────────────────────────────────

export type ICFEventType =
  | 'new_incident'
  | 'ps_updated'
  | 'override_triggered'
  | 'pattern_detected'
  | 'queue_stats';

export interface ICFEvent {
  type: ICFEventType;
  payload: Record<string, unknown>;
  timestamp: string;
}

type EventHandler = (event: ICFEvent) => void;

interface SSEState {
  isConnected: boolean;
  lastEvent: ICFEvent | null;
  onEvent: (handler: EventHandler) => () => void;
}

const SSEContext = createContext<SSEState | null>(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SSE_PATH = '/api/v1/events';
const RECONNECT_MS = 5000;

export function SSEProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<ICFEvent | null>(null);
  const handlersRef = useRef<Set<EventHandler>>(new Set());
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      const es = new EventSource(`${API_URL}${SSE_PATH}`);
      esRef.current = es;

      es.onopen = () => setIsConnected(true);

      es.onmessage = (msg) => {
        try {
          const evt: ICFEvent = JSON.parse(msg.data);
          setLastEvent(evt);
          handlersRef.current.forEach((h) => h(evt));
        } catch {
          // ignore malformed messages
        }
      };

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        reconnectTimer = setTimeout(connect, RECONNECT_MS);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      esRef.current?.close();
      setIsConnected(false);
    };
  }, []);

  const onEvent = useCallback((handler: EventHandler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  return (
    <SSEContext.Provider value={{ isConnected, lastEvent, onEvent }}>
      {children}
    </SSEContext.Provider>
  );
}

export function useSSE() {
  const ctx = useContext(SSEContext);
  if (!ctx) throw new Error('useSSE must be used within SSEProvider');
  return ctx;
}
