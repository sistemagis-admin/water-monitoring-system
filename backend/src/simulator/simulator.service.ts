import mqtt, { MqttClient } from 'mqtt';
import { env } from '../config/env.js';
import { query } from '../infrastructure/db/index.js';
import { logger } from '../shared/utils/logger.js';

interface SimulatedPumpState {
  id: string;
  code: string;
  siteCode: string;
  gatewayCode: string;
  ratedKw: number;
  ratedFlow: number;
  ratedPressure: number;
  running: boolean;
  mode: string;
  flow: number;
  pressure: number;
  powerKw: number;
  temp: number;
  vibration: number;
  energyKwh: number;
}

export class MqttSimulatorService {
  private client: MqttClient | null = null;
  private isRunning = false;
  private telemetryTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private sequence = 1000;
  private waterLevel = 74.5;
  private pumps: Map<string, SimulatedPumpState> = new Map();
  private gateways: Set<string> = new Set(['gw-001', 'gw-002']);
  private siteCode = 'SITE-DEMO';

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    logger.info({
      service: 'simulator',
      event: 'starting',
      message: `Starting SWPMS IoT Virtual Edge Simulator connecting to ${env.MQTT_URL}...`,
    });

    // 1. Initial Sync from Database
    await this.syncPumpsFromDb();

    // 2. Connect to MQTT Broker
    this.client = mqtt.connect(env.MQTT_URL, {
      clientId: `simulator-virtual-plc-${Math.random().toString(16).substring(2, 8)}`,
      clean: true,
      reconnectPeriod: 3000,
    });

    this.client.on('connect', () => {
      logger.info({
        service: 'simulator',
        event: 'connected',
        message: '✅ Virtual IoT Edge Gateway Simulator connected to MQTT broker',
      });

      // Subscribe to command topics across all gateways on this site
      const commandTopic = `${env.MQTT_TOPIC_PREFIX}/${this.siteCode}/+/command`;
      this.client?.subscribe(commandTopic, { qos: 1 }, (err) => {
        if (!err) {
          logger.info({
            service: 'simulator',
            event: 'subscribed_commands',
            message: `Virtual PLC listening for remote pump commands on: ${commandTopic}`,
          });
        }
      });

      // Send initial heartbeat and telemetry immediately
      this.publishHeartbeats();
      this.publishTelemetryBatch();

      // 3. Start Telemetry Loop (every 3 seconds for smooth real-time animation)
      if (this.telemetryTimer) clearInterval(this.telemetryTimer);
      this.telemetryTimer = setInterval(() => this.publishTelemetryBatch(), 3000);

      // 4. Start Gateway Heartbeat Loop (every 10 seconds)
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = setInterval(() => this.publishHeartbeats(), 10000);

      // 5. Periodic DB state sync (every 30 seconds) to catch newly added/updated pumps
      if (this.syncTimer) clearInterval(this.syncTimer);
      this.syncTimer = setInterval(() => this.syncPumpsFromDb(), 30000);
    });

    this.client.on('message', (topic, messageBuffer) => {
      this.handleIncomingCommand(topic, messageBuffer);
    });

    this.client.on('error', (err) => {
      logger.error({
        service: 'simulator',
        event: 'mqtt_error',
        message: err.message,
      });
    });
  }

  public stop(): void {
    this.isRunning = false;
    if (this.telemetryTimer) clearInterval(this.telemetryTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.syncTimer) clearInterval(this.syncTimer);

    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
    logger.info({
      service: 'simulator',
      event: 'stopped',
      message: 'Virtual IoT Edge Simulator stopped',
    });
  }

  private async syncPumpsFromDb(): Promise<void> {
    try {
      const res = await query(`
        SELECT a.id, a.code, a.name, a.status, a.metadata,
               s.code as site_code,
               d.code as gateway_code
        FROM assets a
        LEFT JOIN sites s ON a.site_id = s.id
        LEFT JOIN mqtt_devices d ON a.device_id = d.id
        WHERE a.asset_type = 'PUMP'
        ORDER BY a.code ASC
      `);

      if (res.rows.length > 0 && res.rows[0].site_code) {
        this.siteCode = res.rows[0].site_code;
      }

      for (const row of res.rows) {
        const meta = row.metadata || {};
        const ratedKw = Number(meta.rated_power_kw) || 37.0;
        const ratedFlow = Number(meta.rated_flow_m3h) || 120.0;
        const ratedPressure = Number(meta.rated_pressure_bar) || 4.5;
        const gwCode = row.gateway_code || 'gw-001';
        this.gateways.add(gwCode);

        const isRunning = row.status === 'RUNNING';

        if (!this.pumps.has(row.code)) {
          this.pumps.set(row.code, {
            id: row.id,
            code: row.code,
            siteCode: this.siteCode,
            gatewayCode: gwCode,
            ratedKw,
            ratedFlow,
            ratedPressure,
            running: isRunning,
            mode: 'AUTO',
            flow: isRunning ? ratedFlow * 0.95 : 0,
            pressure: isRunning ? ratedPressure * 0.96 : 0.2,
            powerKw: isRunning ? ratedKw * 0.9 : 0,
            temp: isRunning ? 52.0 : 27.5,
            vibration: isRunning ? 1.35 : 0.04,
            energyKwh: 12500 + Math.random() * 5000,
          });
        } else {
          // Update DB state synchronization
          const current = this.pumps.get(row.code)!;
          current.gatewayCode = gwCode;
          current.ratedKw = ratedKw;
          current.ratedFlow = ratedFlow;
          current.ratedPressure = ratedPressure;
          // Synchronize running state if changed via other channels
          if (current.running !== isRunning) {
            current.running = isRunning;
          }
        }
      }
    } catch (err: any) {
      logger.warn({
        service: 'simulator',
        event: 'sync_error',
        message: err.message,
      });
    }
  }

  private publishHeartbeats(): void {
    if (!this.client || !this.client.connected) return;

    for (const gw of this.gateways) {
      const statusTopic = `${env.MQTT_TOPIC_PREFIX}/${this.siteCode}/${gw}/status`;
      const statusPayload = {
        version: 1,
        device_id: gw,
        timestamp: new Date().toISOString(),
        status: 'ONLINE',
        firmware: '2.1.0-ind',
        ip: '192.168.1.100',
        rssi: -58 + Math.floor((Math.random() - 0.5) * 4),
        uptime_s: Math.floor(process.uptime()),
      };

      this.client.publish(statusTopic, JSON.stringify(statusPayload), { qos: 1, retain: true });
    }
  }

  private publishTelemetryBatch(): void {
    if (!this.client || !this.client.connected || this.pumps.size === 0) return;

    this.sequence++;
    // Subtle realistic reservoir level wave (between 68% and 82%)
    this.waterLevel = Math.max(55, Math.min(92, this.waterLevel + (Math.random() - 0.49) * 0.4));

    for (const [, pump] of this.pumps) {
      const topic = `${env.MQTT_TOPIC_PREFIX}/${this.siteCode}/${pump.gatewayCode}/telemetry`;

      // Physics calculation with realistic dynamic fluctuations
      if (pump.running) {
        const flowNoise = (Math.random() - 0.5) * (pump.ratedFlow * 0.03);
        const pressNoise = (Math.random() - 0.5) * (pump.ratedPressure * 0.02);
        const kwNoise = (Math.random() - 0.5) * (pump.ratedKw * 0.03);

        pump.flow = Math.max(0, pump.ratedFlow * 0.96 + flowNoise);
        pump.pressure = Math.max(0.5, pump.ratedPressure * 0.97 + pressNoise);
        pump.powerKw = Math.max(1.0, pump.ratedKw * 0.91 + kwNoise);
        pump.temp = Math.min(78, Math.max(48, pump.temp + (Math.random() - 0.48) * 0.25));
        pump.vibration = Number((1.3 + (Math.random() - 0.5) * 0.15).toFixed(2));
        pump.energyKwh += (pump.powerKw * 3) / 3600; // 3 second energy increment
      } else {
        // Stopped / standby pump
        pump.flow = 0;
        pump.pressure = 0.2;
        pump.powerKw = 0;
        pump.temp = Math.max(26.5, pump.temp - 0.15); // gentle cooling
        pump.vibration = 0.03;
      }

      const currentAmp = pump.running ? pump.powerKw * 1.82 : 0.0;
      const voltage = 380.0 + (Math.random() - 0.5) * 3.5;
      const frequency = pump.running ? 50.0 + (Math.random() - 0.5) * 0.15 : 0.0;
      const rpm = pump.running ? 2950 + Math.floor((Math.random() - 0.5) * 15) : 0;

      const payload = {
        version: 1,
        device_id: pump.gatewayCode,
        asset_id: pump.code,
        timestamp: new Date().toISOString(),
        sequence: this.sequence,
        metrics: {
          pump_running: pump.running,
          pump_mode: pump.mode,
          pump_fault: false,
          flow_m3h: Number(pump.flow.toFixed(1)),
          pressure_bar: Number(pump.pressure.toFixed(2)),
          suction_pressure_bar: Number((pump.pressure * 0.32).toFixed(2)),
          power_kw: Number(pump.powerKw.toFixed(1)),
          current_a: Number(currentAmp.toFixed(1)),
          voltage_v: Number(voltage.toFixed(1)),
          power_factor: pump.running ? 0.88 : 0.0,
          frequency_hz: Number(frequency.toFixed(2)),
          motor_temp_c: Number(pump.temp.toFixed(1)),
          vibration_mm_s: pump.vibration,
          rpm,
          tank_level_pct: Number(this.waterLevel.toFixed(1)),
          energy_kwh: Math.floor(pump.energyKwh),
          gateway_uptime_s: Math.floor(process.uptime()),
          signal_rssi: -59,
        },
        quality: 'GOOD',
      };

      this.client.publish(topic, JSON.stringify(payload), { qos: 1 });
    }
  }

  private handleIncomingCommand(topic: string, messageBuffer: Buffer): void {
    try {
      const payload = JSON.parse(messageBuffer.toString());
      logger.info({
        service: 'simulator',
        event: 'received_command',
        message: `📥 Virtual PLC received command on ${topic}: ${payload.command} (${payload.desired_state}) for asset: ${payload.asset_id}`,
      });

      if (payload.command === 'PUMP_POWER' && payload.asset_id) {
        const targetState = payload.desired_state === 'ON';
        const assetCode = payload.asset_id;

        // Simulate 750ms PLC interlock & contactor actuation delay
        setTimeout(() => {
          let pump = this.pumps.get(assetCode);
          if (!pump) {
            // Find by code case-insensitively
            for (const [, p] of this.pumps) {
              if (p.code.toUpperCase() === assetCode.toUpperCase()) {
                pump = p;
                break;
              }
            }
          }

          if (pump) {
            pump.running = targetState;
            if (targetState) {
              pump.flow = pump.ratedFlow * 0.95;
              pump.pressure = pump.ratedPressure * 0.96;
              pump.powerKw = pump.ratedKw * 0.9;
              pump.temp = Math.max(pump.temp, 48.0);
            } else {
              pump.flow = 0;
              pump.pressure = 0.2;
              pump.powerKw = 0;
            }
          }

          // Acknowledge back via MQTT command_ack topic
          const ackTopic = topic.replace('/command', '/command_ack');
          const ackPayload = {
            version: 1,
            command_id: payload.command_id,
            timestamp: new Date().toISOString(),
            asset_id: assetCode,
            status: 'EXECUTED',
            desired_state: payload.desired_state,
            actual_state: payload.desired_state,
            message: `Virtual PLC verified safety interlocks: Contactor closed for ${assetCode} (${payload.desired_state})`,
          };

          this.client?.publish(ackTopic, JSON.stringify(ackPayload), { qos: 1 });
          logger.info({
            service: 'simulator',
            event: 'sent_ack',
            message: `📤 Published Command Acknowledgement to ${ackTopic}: EXECUTED (${payload.desired_state})`,
          });

          // Immediate telemetry batch to notify frontend in sub-second time
          this.publishTelemetryBatch();
        }, 750);
      }
    } catch (err: any) {
      logger.error({
        service: 'simulator',
        event: 'command_process_error',
        message: err.message,
      });
    }
  }
}

export const mqttSimulatorService = new MqttSimulatorService();
