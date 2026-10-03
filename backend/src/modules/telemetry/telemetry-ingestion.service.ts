import { query } from '../../infrastructure/db/index.js';
import { sseManager } from '../../infrastructure/realtime/sse-manager.js';
import { alarmEngineService } from '../alarms/alarm-engine.service.js';
import { logger } from '../../shared/utils/logger.js';
import { PumpStatus } from '../../shared/types/domain.js';

export interface IngestTelemetryPayload {
  version: number;
  device_id: string;
  asset_id?: string;
  timestamp: string;
  sequence?: number;
  metrics: Record<string, any>;
  quality?: 'GOOD' | 'BAD' | 'UNCERTAIN' | 'STALE';
}

export class TelemetryIngestionService {
  async ingest(siteCodeOrId: string, deviceCodeOrId: string, payload: IngestTelemetryPayload) {
    const receivedAt = new Date();

    // 1. Resolve Site
    const siteRes = await query(
      `SELECT id, code FROM sites WHERE id::text = $1 OR code = $1`,
      [siteCodeOrId]
    );
    if (siteRes.rows.length === 0) {
      logger.warn({
        service: 'telemetry_ingestion',
        event: 'site_not_found',
        message: `Unknown site: ${siteCodeOrId}`,
        site_id: siteCodeOrId,
      });
      return;
    }
    const site = siteRes.rows[0];

    // 2. Resolve Device
    const devRes = await query(
      `SELECT id, code, site_id FROM mqtt_devices WHERE (id::text = $1 OR code = $1) AND site_id = $2`,
      [deviceCodeOrId, site.id]
    );
    if (devRes.rows.length === 0) {
      logger.warn({
        service: 'telemetry_ingestion',
        event: 'device_not_registered',
        message: `Unknown device: ${deviceCodeOrId} on site: ${site.code}`,
        device_id: deviceCodeOrId,
      });
      return;
    }
    const device = devRes.rows[0];

    // 3. Update device last seen & state
    await query(
      `UPDATE mqtt_devices
       SET status = 'ONLINE', last_seen_at = $1, updated_at = $1
       WHERE id = $2`,
      [receivedAt, device.id]
    );

    await query(
      `INSERT INTO device_current_state (device_id, status, last_seen_at, last_telemetry_at, updated_at)
       VALUES ($1, 'ONLINE', $2, $2, $2)
       ON CONFLICT (device_id) DO UPDATE SET
         status = 'ONLINE',
         last_seen_at = EXCLUDED.last_seen_at,
         last_telemetry_at = EXCLUDED.last_telemetry_at,
         updated_at = EXCLUDED.updated_at`,
      [device.id, receivedAt]
    );

    // 4. Resolve Asset if present
    let assetId: string | null = null;
    let assetCode: string | null = payload.asset_id || null;
    if (assetCode) {
      const assetRes = await query(
        `SELECT id, code, status FROM assets WHERE (id::text = $1 OR code = $1) AND site_id = $2`,
        [assetCode, site.id]
      );
      if (assetRes.rows.length > 0) {
        assetId = assetRes.rows[0].id;
        assetCode = assetRes.rows[0].code;
      }
    }

    // 5. Persist raw telemetry sample
    await query(
      `INSERT INTO telemetry_samples (site_id, source_device_id, asset_id, device_timestamp, received_at, sequence, quality, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        site.id,
        device.id,
        assetId,
        payload.timestamp ? new Date(payload.timestamp) : receivedAt,
        receivedAt,
        payload.sequence ?? null,
        payload.quality || 'GOOD',
        JSON.stringify(payload),
      ]
    );

    // 6. If asset exists, update asset_current_state and determine pump status
    if (assetId) {
      const metrics = payload.metrics || {};
      let pumpStatus: PumpStatus = 'STOPPED';

      if (metrics.pump_fault === true || metrics.fault === true) {
        pumpStatus = 'FAULT';
      } else if (metrics.pump_running === true || metrics.running === true) {
        pumpStatus = 'RUNNING';
      } else {
        pumpStatus = 'STOPPED';
      }

      await query(
        `INSERT INTO asset_current_state (asset_id, last_timestamp, status, metrics, quality, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (asset_id) DO UPDATE SET
           last_timestamp = EXCLUDED.last_timestamp,
           status = EXCLUDED.status,
           metrics = asset_current_state.metrics || EXCLUDED.metrics,
           quality = EXCLUDED.quality,
           updated_at = EXCLUDED.updated_at`,
        [
          assetId,
          payload.timestamp ? new Date(payload.timestamp) : receivedAt,
          pumpStatus,
          JSON.stringify(metrics),
          payload.quality || 'GOOD',
          receivedAt,
        ]
      );

      await query(`UPDATE assets SET status = $1, updated_at = $2 WHERE id = $3`, [
        pumpStatus,
        receivedAt,
        assetId,
      ]);

      // 7. Evaluate alarms
      await alarmEngineService.evaluate({
        site_id: site.id,
        device_id: device.id,
        asset_id: assetId,
        metrics,
        timestamp: payload.timestamp || receivedAt.toISOString(),
      });

      // 8. Broadcast SSE updates
      sseManager.broadcast(
        'telemetry.update',
        {
          asset_id: assetId,
          asset_code: assetCode,
          device_id: device.id,
          site_id: site.id,
          metrics,
          timestamp: payload.timestamp || receivedAt.toISOString(),
          quality: payload.quality || 'GOOD',
        },
        site.id
      );

      sseManager.broadcast(
        'asset.state',
        {
          asset_id: assetId,
          asset_code: assetCode,
          status: pumpStatus,
          metrics,
          quality: payload.quality || 'GOOD',
          updated_at: receivedAt.toISOString(),
        },
        site.id
      );
    }
  }
}

export const telemetryIngestionService = new TelemetryIngestionService();
