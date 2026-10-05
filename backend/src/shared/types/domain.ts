export type PumpStatus =
  | 'RUNNING'
  | 'STOPPED'
  | 'FAULT'
  | 'MAINTENANCE'
  | 'OFFLINE'
  | 'COMMANDING'
  | 'UNKNOWN';

export type DeviceStatus =
  | 'ONLINE'
  | 'STALE'
  | 'OFFLINE'
  | 'UNKNOWN';

export type AlarmStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'RESOLVED';

export type AlarmSeverity =
  | 'INFO'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export type TelemetryQuality =
  | 'GOOD'
  | 'BAD'
  | 'UNCERTAIN'
  | 'STALE';

export type CommandState =
  | 'PENDING'
  | 'SENT'
  | 'ACCEPTED'
  | 'EXECUTED'
  | 'REJECTED'
  | 'FAILED'
  | 'TIMEOUT'
  | 'CANCELLED';

export interface MetricValue {
  code: string;
  value: number | string | boolean | null;
  unit?: string;
  quality: TelemetryQuality;
}

export interface AuthUserPayload {
  id: string;
  email?: string;
  role?: string;
  permissions?: string[];
  site_id?: string | null;
  type?: 'access' | 'refresh';
}
