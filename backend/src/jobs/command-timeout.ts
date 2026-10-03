import { query } from '../infrastructure/db/index.js';
import { sseManager } from '../infrastructure/realtime/sse-manager.js';
import { logger } from '../shared/utils/logger.js';

export async function checkCommandTimeouts() {
  try {
    const expiredRes = await query(
      `SELECT pc.*, a.code as asset_code
       FROM pump_commands pc
       JOIN assets a ON pc.asset_id = a.id
       WHERE pc.status IN ('PENDING', 'SENT')
         AND pc.timeout_at < CURRENT_TIMESTAMP`
    );

    for (const cmd of expiredRes.rows) {
      await query(
        `UPDATE pump_commands
         SET status = 'TIMEOUT', completed_at = CURRENT_TIMESTAMP,
             response_message = 'Command timed out waiting for gateway/PLC acknowledgement'
         WHERE id = $1`,
        [cmd.id]
      );

      // Revert asset commanding state
      await query(
        `UPDATE asset_current_state
         SET desired_state = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE asset_id = $1`,
        [cmd.asset_id]
      );

      logger.warn({
        service: 'pump_command',
        event: 'command_timeout',
        message: `Pump command ${cmd.command_id} timed out`,
        command_id: cmd.command_id,
        asset_id: cmd.asset_code,
      });

      // Emit SSE
      sseManager.broadcast(
        'command.updated',
        {
          id: cmd.id,
          command_id: cmd.command_id,
          status: 'TIMEOUT',
          message: 'Command timed out waiting for gateway/PLC acknowledgement',
        },
        cmd.site_id
      );
    }
  } catch (err: any) {
    logger.error({
      service: 'pump_command',
      event: 'timeout_check_error',
      message: err.message,
    });
  }
}

export function startCommandTimeoutJob(intervalMs = 3000) {
  const timer = setInterval(checkCommandTimeouts, intervalMs);
  return () => clearInterval(timer);
}
