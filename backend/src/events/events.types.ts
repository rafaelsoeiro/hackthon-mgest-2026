export type ICFEventType =
  | 'new_incident'
  | 'ps_updated'
  | 'override_triggered'
  | 'pattern_detected'
  | 'queue_stats';

export interface ICFEvent {
  type: ICFEventType;
  payload: Record<string, any>;
  timestamp: string;
}
