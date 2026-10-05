import crypto from 'crypto';
import { query } from '../../infrastructure/db/index.js';
import { sseManager } from '../../infrastructure/realtime/sse-manager.js';
import { AppError } from '../../shared/errors/app-error.js';
import { logger } from '../../shared/utils/logger.js';
import { env } from '../../config/env.js';

export interface IssuePumpPowerCommandInput {
  assetId: string;
  desiredState: 'ON' | 'OFF';
  confirmation: boolean;
  idempotencyKey?: string;
  note?: string;
  userId: string;
  timeoutSeconds?: number;
}

export interface CommandAckPayload {
  version: number;
  command_id: string;
  timestamp: string;
  asset_id: string;
  status: 'ACCEPTED' | 'EXECUTED' | 'REJECTED' | 'FAILED' | 'TIMEOUT';
  desired_state?: string;
  actual_state?: string;
  message?: string;
}

export class PumpCommandService {
  private mqttPublisher: ((topic: string, message: string) => Promise<boolean>) | null = null;

  public setMqttPublisher(publisher: (topic: string, message: string) => Promise<boolean>) {
    this.mqttPublisher = publisher;
  }

  async issuePowerCommand(input: IssuePumpPowerCommandInput) {
    if (!input.confirmation) {
      throw AppError.badRequest('Confirmation is required to execute pump command');
    }

    // 1. Resolve Asset & Device
    const assetRes = await query(
      `SELECT a.*, d.code as device_code, d.status as device_status, s.code as site_code
       FROM assets a
       LEFT JOIN mqtt_devices d ON a.device_id = d.id
       LEFT JOIN sites s ON a.site_id = s.id
       WHERE a.id = $1`,
      [input.assetId]
    );

    if (assetRes.rows.length === 0) {
      throw AppError.notFound('Asset not found');
    }
    const asset = assetRes.rows[0];

    const metadata = asset.metadata || {};
    if (!metadata.control_enabled && !metadata.power_command) {
      throw AppError.badRequest('Asset does not have remote control capability enabled', 'AUTH_FORBIDDEN');
    }

    if (asset.device_status !== 'ONLINE') {
      if (env.NODE_ENV === 'development') {
        // In local development mode, auto-online the device so local pump commands succeed
        await query(
          `UPDATE mqtt_devices SET status = 'ONLINE', last_seen_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [asset.device_id]
        );
        await query(
          `UPDATE device_current_state SET status = 'ONLINE', updated_at = CURRENT_TIMESTAMP WHERE device_id = $1`,
          [asset.device_id]
        );
        asset.device_status = 'ONLINE';
      } else {
        throw AppError.badRequest('Cannot send command: Gateway device is currently OFFLINE', 'DEVICE_OFFLINE');
      }
    }

    // 2. Check Idempotency / Active Command
    if (input.idempotencyKey) {
      const existingCmd = await query(
        `SELECT * FROM pump_commands WHERE idempotency_key = $1`,
        [input.idempotencyKey]
      );
      if (existingCmd.rows.length > 0) {
        return existingCmd.rows[0];
      }
    }

    const activeCmd = await query(
      `SELECT id, command_id, status FROM pump_commands
       WHERE asset_id = $1 AND status IN ('PENDING', 'SENT')`,
      [asset.id]
    );
    if (activeCmd.rows.length > 0) {
      throw AppError.badRequest(
        `A power command (${activeCmd.rows[0].command_id}) is currently in progress for this pump`,
        'DUPLICATE_RESOURCE'
      );
    }

    // 3. Create Pending Command
    const commandId = `cmd_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const timeoutSec = input.timeoutSeconds || env.COMMAND_TIMEOUT_SECONDS;
    const timeoutAt = new Date(Date.now() + timeoutSec * 1000);

    const insertRes = await query(
      `INSERT INTO pump_commands (
         command_id, site_id, device_id, asset_id, command_type,
         desired_state, status, requested_by, timeout_at,
         idempotency_key, metadata
       ) VALUES ($1, $2, $3, $4, 'PUMP_POWER', $5, 'PENDING', $6, $7, $8, $9)
       RETURNING *`,
      [
        commandId,
        asset.site_id,
        asset.device_id,
        asset.id,
        input.desiredState,
        input.userId,
        timeoutAt,
        input.idempotencyKey || null,
        JSON.stringify({ note: input.note }),
      ]
    );
    const command = insertRes.rows[0];

    // 4. Update asset state to COMMANDING
    await query(
      `UPDATE asset_current_state
       SET desired_state = $1, status = 'COMMANDING', updated_at = CURRENT_TIMESTAMP
       WHERE asset_id = $2`,
      [input.desiredState, asset.id]
    );

    // 5. Publish to MQTT if client configured
    const topic = `${env.MQTT_TOPIC_PREFIX}/${asset.site_code}/${asset.device_code}/command`;
    const payload = {
      version: 1,
      command_id: commandId,
      issued_at: new Date().toISOString(),
      issued_by: input.userId,
      command: 'PUMP_POWER',
      asset_id: asset.code,
      desired_state: input.desiredState,
      timeout_seconds: timeoutSec,
      reason: input.note || 'Operator operation',
    };

    let sent = false;
    if (this.mqttPublisher) {
      try {
        sent = await this.mqttPublisher(topic, JSON.stringify(payload));
      } catch (err: any) {
        logger.error({
          service: 'pump_command',
          event: 'publish_error',
          message: err.message,
          command_id: commandId,
        });
      }
    }

    if (sent) {
      await query(
        `UPDATE pump_commands SET status = 'SENT', sent_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [command.id]
      );
      command.status = 'SENT';
    }

    // 6. Audit Log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
       VALUES ($1, 'PUMP_POWER_COMMAND_ISSUED', 'PUMP_COMMAND', $2, $3)`,
      [input.userId, command.id, JSON.stringify({ commandId, assetCode: asset.code, desiredState: input.desiredState })]
    );

    // 7. Emit SSE
    sseManager.broadcast('command.updated', command, asset.site_id);

    // Auto-ack fallback in development mode if no external PLC simulator acknowledges within 600ms
    if (env.NODE_ENV === 'development') {
      setTimeout(async () => {
        try {
          const checkCmd = await query(
            `SELECT status FROM pump_commands WHERE command_id = $1`,
            [commandId]
          );
          if (checkCmd.rows.length > 0 && ['PENDING', 'SENT'].includes(checkCmd.rows[0].status)) {
            await this.handleAck(asset.site_code || 'SITE-DEMO', asset.device_code || 'gw-001', {
              version: 1,
              command_id: commandId,
              timestamp: new Date().toISOString(),
              asset_id: asset.code,
              status: 'EXECUTED',
              desired_state: input.desiredState,
              actual_state: input.desiredState,
              message: `Simulated PLC interlock verified: ${asset.code} switched ${input.desiredState}`,
            });
          }
        } catch (err: any) {
          logger.warn({
            service: 'pump_command',
            event: 'dev_auto_ack_error',
            message: err.message,
          });
        }
      }, 600);
    }

    return command;
  }

  async handleAck(siteCode: string, deviceCode: string, ack: CommandAckPayload) {
    const cmdRes = await query(
      `SELECT pc.*, a.id as asset_id, a.code as asset_code
       FROM pump_commands pc
       JOIN assets a ON pc.asset_id = a.id
       WHERE pc.command_id = $1`,
      [ack.command_id]
    );

    if (cmdRes.rows.length === 0) {
      logger.warn({
        service: 'pump_command',
        event: 'unknown_command_ack',
        message: `Unknown command acknowledgement: ${ack.command_id}`,
      });
      return;
    }

    const cmd = cmdRes.rows[0];
    const isCompleted = ['EXECUTED', 'REJECTED', 'FAILED', 'TIMEOUT'].includes(ack.status);
    const completedAt = isCompleted ? new Date() : null;

    await query(
      `UPDATE pump_commands
       SET status = $1, actual_state = $2, acknowledged_at = CURRENT_TIMESTAMP,
           completed_at = COALESCE($3, completed_at), response_message = $4
       WHERE id = $5`,
      [ack.status, ack.actual_state || null, completedAt, ack.message || null, cmd.id]
    );

    // If actual state was reported, update current state
    if (ack.actual_state) {
      const isRunning = ack.actual_state === 'ON';
      const status = isRunning ? 'RUNNING' : 'STOPPED';

      await query(
        `UPDATE asset_current_state
         SET status = $1, desired_state = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE asset_id = $2`,
        [status, cmd.asset_id]
      );

      await query(`UPDATE assets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
        status,
        cmd.asset_id,
      ]);

      // Broadcast asset status update via SSE
      sseManager.broadcast(
        'asset.status',
        { asset_id: cmd.asset_id, asset_code: cmd.asset_code, status },
        cmd.site_id
      );
    }

    // Broadcast SSE
    sseManager.broadcast(
      'command.updated',
      {
        id: cmd.id,
        command_id: cmd.command_id,
        status: ack.status,
        actual_state: ack.actual_state,
        message: ack.message,
      },
      cmd.site_id
    );
  }
}

export const pumpCommandService = new PumpCommandService();
