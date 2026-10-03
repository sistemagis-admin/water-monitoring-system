import { query, transaction } from '../../infrastructure/db/index.js';
import { sseManager } from '../../infrastructure/realtime/sse-manager.js';
import { logger } from '../../shared/utils/logger.js';

export interface EvaluateTelemetryInput {
  site_id: string;
  device_id: string;
  asset_id?: string;
  metrics: Record<string, any>;
  timestamp: string;
}

export class AlarmEngineService {
  /**
   * Evaluates alarm rules against incoming telemetry metrics
   */
  async evaluate(input: EvaluateTelemetryInput) {
    const { site_id, device_id, asset_id, metrics } = input;
    if (!asset_id && !site_id) return;

    try {
      // Find rules matching this asset or site
      let rulesQuery = `
        SELECT * FROM alarm_rules
        WHERE enabled = true
          AND (asset_id = $1 OR (asset_id IS NULL AND site_id = $2))
      `;
      const rulesRes = await query(rulesQuery, [asset_id || null, site_id]);

      for (const rule of rulesRes.rows) {
        const metricCode = rule.metric_code;
        const val = metrics[metricCode];

        if (val === undefined || val === null) {
          continue;
        }

        const numVal = typeof val === 'number' ? val : (typeof val === 'boolean' ? (val ? 1 : 0) : NaN);
        const threshold = Number(rule.threshold);

        let isTriggered = false;
        if (!isNaN(numVal) && !isNaN(threshold)) {
          switch (rule.operator) {
            case '>':
              isTriggered = numVal > threshold;
              break;
            case '>=':
              isTriggered = numVal >= threshold;
              break;
            case '<':
              isTriggered = numVal < threshold;
              break;
            case '<=':
              isTriggered = numVal <= threshold;
              break;
            case '==':
              isTriggered = numVal === threshold;
              break;
            case '!=':
              isTriggered = numVal !== threshold;
              break;
          }
        }

        if (isTriggered) {
          await this.handleTriggeredAlarm(rule, input, numVal);
        } else {
          await this.handleNormalCondition(rule, input, numVal);
        }
      }
    } catch (err: any) {
      logger.error({
        service: 'alarm_engine',
        event: 'evaluation_error',
        message: err.message,
        asset_id,
        site_id,
      });
    }
  }

  private async handleTriggeredAlarm(rule: any, input: EvaluateTelemetryInput, val: number) {
    // Check if active alarm already exists (Deduplication)
    const existing = await query(
      `SELECT id, status FROM alarms
       WHERE rule_id = $1 AND (asset_id = $2 OR (asset_id IS NULL AND $2 IS NULL)) AND status IN ('OPEN', 'ACKNOWLEDGED')`,
      [rule.id, input.asset_id || null]
    );

    if (existing.rows.length === 0) {
      // Open new alarm
      const msg = `${rule.name}: current value ${val} violated threshold (${rule.operator} ${rule.threshold})`;
      const insRes = await query(
        `INSERT INTO alarms (rule_id, site_id, asset_id, device_id, status, severity, opened_at, last_value, message)
         VALUES ($1, $2, $3, $4, 'OPEN', $5, CURRENT_TIMESTAMP, $6, $7)
         RETURNING *`,
        [rule.id, input.site_id, input.asset_id || null, input.device_id, rule.severity, val, msg]
      );
      const newAlarm = insRes.rows[0];

      // Insert alarm history
      await query(
        `INSERT INTO alarm_history (alarm_id, action, from_status, to_status, note)
         VALUES ($1, 'OPEN', 'NONE', 'OPEN', $2)`,
        [newAlarm.id, msg]
      );

      // Insert event
      await query(
        `INSERT INTO events (site_id, asset_id, device_id, event_type, event_code, severity, message, occurred_at)
         VALUES ($1, $2, $3, 'ALARM', 'ALARM_OPENED', $4, $5, CURRENT_TIMESTAMP)`,
        [input.site_id, input.asset_id || null, input.device_id, rule.severity, msg]
      );

      // Emit SSE
      sseManager.broadcast('alarm.created', newAlarm, input.site_id);
    } else {
      // Update last value
      await query(`UPDATE alarms SET last_value = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
        val,
        existing.rows[0].id,
      ]);
    }
  }

  private async handleNormalCondition(rule: any, input: EvaluateTelemetryInput, val: number) {
    const existing = await query(
      `SELECT id, status FROM alarms
       WHERE rule_id = $1 AND (asset_id = $2 OR (asset_id IS NULL AND $2 IS NULL)) AND status IN ('OPEN', 'ACKNOWLEDGED')`,
      [rule.id, input.asset_id || null]
    );

    if (existing.rows.length > 0) {
      const alarm = existing.rows[0];
      const resolveMsg = 'Condition returned to normal range';

      await query(
        `UPDATE alarms
         SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP, resolved_reason = $1, last_value = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [resolveMsg, val, alarm.id]
      );

      await query(
        `INSERT INTO alarm_history (alarm_id, action, from_status, to_status, note)
         VALUES ($1, 'RESOLVE', $2, 'RESOLVED', $3)`,
        [alarm.id, alarm.status, resolveMsg]
      );

      await query(
        `INSERT INTO events (site_id, asset_id, device_id, event_type, event_code, severity, message, occurred_at)
         VALUES ($1, $2, $3, 'ALARM', 'ALARM_RESOLVED', 'INFO', $4, CURRENT_TIMESTAMP)`,
        [input.site_id, input.asset_id || null, input.device_id, `${rule.name}: ${resolveMsg}`]
      );

      sseManager.broadcast('alarm.updated', { id: alarm.id, status: 'RESOLVED', rule_id: rule.id }, input.site_id);
    }
  }
}

export const alarmEngineService = new AlarmEngineService();
