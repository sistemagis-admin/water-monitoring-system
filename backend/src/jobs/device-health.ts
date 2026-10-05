import { query } from '../infrastructure/db/index.js';
import { sseManager } from '../infrastructure/realtime/sse-manager.js';
import { env } from '../config/env.js';
import { logger } from '../shared/utils/logger.js';

export async function checkDeviceHealth() {
  if (env.NODE_ENV === 'development') {
    // In local development / demo environment without physical edge hardware,
    // maintain virtual gateway devices as ONLINE so operator commands succeed
    await query(`UPDATE mqtt_devices SET status = 'ONLINE', last_seen_at = CURRENT_TIMESTAMP WHERE status != 'ONLINE'`);
    await query(`UPDATE device_current_state SET status = 'ONLINE', updated_at = CURRENT_TIMESTAMP WHERE status != 'ONLINE'`);
    return;
  }

  const timeoutMs = env.DEVICE_OFFLINE_TIMEOUT;
  const thresholdDate = new Date(Date.now() - timeoutMs);

  try {
    // Find devices that were ONLINE or UNKNOWN and haven't sent a message recently
    const devicesRes = await query(
      `SELECT d.id, d.code, d.name, d.site_id, d.last_seen_at
       FROM mqtt_devices d
       WHERE d.status != 'OFFLINE'
         AND (d.last_seen_at IS NULL OR d.last_seen_at < $1)`,
      [thresholdDate]
    );

    for (const dev of devicesRes.rows) {
      // 1. Mark device OFFLINE
      await query(
        `UPDATE mqtt_devices SET status = 'OFFLINE', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [dev.id]
      );

      await query(
        `UPDATE device_current_state
         SET status = 'OFFLINE', updated_at = CURRENT_TIMESTAMP
         WHERE device_id = $1`,
        [dev.id]
      );

      logger.warn({
        service: 'device_health',
        event: 'device_offline',
        message: `Device ${dev.code} timed out, marked as OFFLINE`,
        device_id: dev.code,
        site_id: dev.site_id,
      });

      // 2. Generate Event
      await query(
        `INSERT INTO events (site_id, device_id, event_type, event_code, severity, message, occurred_at)
         VALUES ($1, $2, 'DEVICE', 'DEVICE_OFFLINE', 'HIGH', $3, CURRENT_TIMESTAMP)`,
        [dev.site_id, dev.id, `Gateway device ${dev.code} connection lost (offline timeout)`]
      );

      // 3. Mark dependent assets as OFFLINE
      const assetsRes = await query(
        `UPDATE assets
         SET status = 'OFFLINE', updated_at = CURRENT_TIMESTAMP
         WHERE device_id = $1
         RETURNING id, code`,
        [dev.id]
      );

      for (const asset of assetsRes.rows) {
        await query(
          `UPDATE asset_current_state
           SET status = 'OFFLINE', quality = 'STALE', updated_at = CURRENT_TIMESTAMP
           WHERE asset_id = $1`,
          [asset.id]
        );

        sseManager.broadcast(
          'asset.status',
          { asset_id: asset.id, asset_code: asset.code, status: 'OFFLINE', quality: 'STALE' },
          dev.site_id
        );
      }

      // 4. Emit SSE device.status
      sseManager.broadcast(
        'device.status',
        { device_id: dev.id, device_code: dev.code, status: 'OFFLINE', last_seen_at: dev.last_seen_at },
        dev.site_id
      );
    }
  } catch (err: any) {
    logger.error({
      service: 'device_health',
      event: 'check_error',
      message: err.message,
    });
  }
}

export function startDeviceHealthJob(intervalMs = 10000) {
  const timer = setInterval(checkDeviceHealth, intervalMs);
  return () => clearInterval(timer);
}
