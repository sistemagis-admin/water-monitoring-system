import { query } from '../../infrastructure/db/index.js';
import { sseManager } from '../../infrastructure/realtime/sse-manager.js';
import { logger } from '../../shared/utils/logger.js';

export interface DeviceStatusPayload {
  version: number;
  device_id: string;
  timestamp: string;
  status: 'ONLINE' | 'OFFLINE' | 'STALE';
  firmware?: string;
  ip?: string;
  rssi?: number;
  uptime_s?: number;
}

export interface DeviceEventPayload {
  version: number;
  device_id: string;
  asset_id?: string;
  timestamp: string;
  event_code: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  metadata?: Record<string, any>;
}

export class DeviceIngestionService {
  async handleStatus(siteCodeOrId: string, deviceCodeOrId: string, payload: DeviceStatusPayload) {
    const receivedAt = new Date();

    const devRes = await query(
      `SELECT d.id, d.code, d.site_id, s.id as site_uuid
       FROM mqtt_devices d
       JOIN sites s ON d.site_id = s.id
       WHERE (d.id::text = $1 OR d.code = $1) AND (s.id::text = $2 OR s.code = $2)`,
      [deviceCodeOrId, siteCodeOrId]
    );

    if (devRes.rows.length === 0) return;
    const device = devRes.rows[0];

    await query(
      `UPDATE mqtt_devices
       SET status = $1, last_seen_at = $2, last_status_at = $2,
           firmware_version = COALESCE($3, firmware_version),
           ip_address = COALESCE($4, ip_address),
           rssi = COALESCE($5, rssi),
           uptime_s = COALESCE($6, uptime_s),
           updated_at = $2
       WHERE id = $7`,
      [payload.status, receivedAt, payload.firmware, payload.ip, payload.rssi, payload.uptime_s, device.id]
    );

    await query(
      `INSERT INTO device_current_state (device_id, status, last_seen_at, last_status_at, metadata, updated_at)
       VALUES ($1, $2, $3, $3, $4, $3)
       ON CONFLICT (device_id) DO UPDATE SET
         status = EXCLUDED.status,
         last_seen_at = EXCLUDED.last_seen_at,
         last_status_at = EXCLUDED.last_status_at,
         metadata = device_current_state.metadata || EXCLUDED.metadata,
         updated_at = EXCLUDED.updated_at`,
      [
        device.id,
        payload.status,
        receivedAt,
        JSON.stringify({ firmware: payload.firmware, ip: payload.ip, rssi: payload.rssi }),
      ]
    );

    sseManager.broadcast(
      'device.status',
      {
        device_id: device.id,
        device_code: device.code,
        status: payload.status,
        last_seen_at: receivedAt.toISOString(),
      },
      device.site_uuid
    );
  }

  async handleEvent(siteCodeOrId: string, deviceCodeOrId: string, payload: DeviceEventPayload) {
    const devRes = await query(
      `SELECT d.id, d.code, d.site_id, s.id as site_uuid
       FROM mqtt_devices d
       JOIN sites s ON d.site_id = s.id
       WHERE (d.id::text = $1 OR d.code = $1) AND (s.id::text = $2 OR s.code = $2)`,
      [deviceCodeOrId, siteCodeOrId]
    );

    if (devRes.rows.length === 0) return;
    const device = devRes.rows[0];

    let assetId: string | null = null;
    if (payload.asset_id) {
      const aRes = await query(
        `SELECT id FROM assets WHERE (id::text = $1 OR code = $1) AND site_id = $2`,
        [payload.asset_id, device.site_uuid]
      );
      if (aRes.rows[0]) assetId = aRes.rows[0].id;
    }

    const insRes = await query(
      `INSERT INTO events (site_id, asset_id, device_id, event_type, event_code, severity, message, occurred_at, metadata)
       VALUES ($1, $2, $3, 'DEVICE', $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        device.site_uuid,
        assetId,
        device.id,
        payload.event_code,
        payload.severity || 'INFO',
        payload.message,
        payload.timestamp ? new Date(payload.timestamp) : new Date(),
        JSON.stringify(payload.metadata || {}),
      ]
    );

    sseManager.broadcast('event.created', insRes.rows[0], device.site_uuid);
  }
}

export const deviceIngestionService = new DeviceIngestionService();
