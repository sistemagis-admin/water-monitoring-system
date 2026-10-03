import mqtt from 'mqtt';
import { env } from '../config/env.js';

console.log('--- Starting SWPMS IoT Gateway Simulator (gw-001 & gw-002) ---');

const client = mqtt.connect(env.MQTT_URL, {
  clientId: 'simulator-gw-001',
});

const siteCode = 'SITE-DEMO';
const gatewayCode = 'gw-001';

interface PumpState {
  running: boolean;
  mode: string;
  flow: number;
  pressure: number;
  kw: number;
  temp: number;
  vibration: number;
}

const pumps: Record<string, PumpState> = {
  'pump-01': { running: true, mode: 'AUTO', flow: 52.5, pressure: 4.2, kw: 18.2, temp: 48.0, vibration: 1.2 },
  'pump-02': { running: false, mode: 'AUTO', flow: 0.0, pressure: 0.2, kw: 0.0, temp: 28.5, vibration: 0.1 },
  'pump-03': { running: true, mode: 'AUTO', flow: 64.0, pressure: 4.8, kw: 21.5, temp: 52.0, vibration: 1.5 },
  'pump-04': { running: false, mode: 'MANUAL', flow: 0.0, pressure: 0.1, kw: 0.0, temp: 29.0, vibration: 0.0 },
  'pump-05': { running: true, mode: 'AUTO', flow: 78.5, pressure: 6.2, kw: 28.5, temp: 56.5, vibration: 1.8 },
  'pump-06': { running: true, mode: 'AUTO', flow: 77.0, pressure: 6.1, kw: 28.0, temp: 55.0, vibration: 1.7 },
};

let sequence = 1000;
let waterLevel = 72.5;

client.on('connect', () => {
  console.log(`✅ Simulator connected to MQTT broker at ${env.MQTT_URL}`);

  // Subscribe to commands
  const commandTopic = `${env.MQTT_TOPIC_PREFIX}/${siteCode}/+/command`;
  client.subscribe(commandTopic, { qos: 1 }, () => {
    console.log(`📡 Listening for commands on: ${commandTopic}`);
  });

  // Start Telemetry Publication Loop (every 5 seconds)
  setInterval(publishTelemetry, 5000);

  // Start Gateway Status / Heartbeat (every 10 seconds)
  setInterval(publishStatus, 10000);

  // Publish first batch immediately
  publishStatus();
  publishTelemetry();
});

function publishStatus() {
  const statusTopic = `${env.MQTT_TOPIC_PREFIX}/${siteCode}/${gatewayCode}/status`;
  const statusPayload = {
    version: 1,
    device_id: gatewayCode,
    timestamp: new Date().toISOString(),
    status: 'ONLINE',
    firmware: '1.0.4',
    ip: '192.168.1.100',
    rssi: -62 + Math.floor((Math.random() - 0.5) * 4),
    uptime_s: Math.floor(process.uptime()),
  };

  client.publish(statusTopic, JSON.stringify(statusPayload), { qos: 1, retain: true });
}

function publishTelemetry() {
  sequence++;
  // Slow sinusoidal fluctuation for water level
  waterLevel = Math.max(25, Math.min(92, waterLevel + (Math.random() - 0.49) * 0.8));

  for (const [pumpId, state] of Object.entries(pumps)) {
    const gw = pumpId === 'pump-05' || pumpId === 'pump-06' ? 'gw-002' : 'gw-001';
    const topic = `${env.MQTT_TOPIC_PREFIX}/${siteCode}/${gw}/telemetry`;

    // Add small realistic noise
    const currentFlow = state.running ? Math.max(0, state.flow + (Math.random() - 0.5) * 1.5) : 0;
    const currentPressure = state.running ? Math.max(0, state.pressure + (Math.random() - 0.5) * 0.2) : 0.2;
    const currentKw = state.running ? Math.max(0, state.kw + (Math.random() - 0.5) * 0.8) : 0;
    const currentAmp = state.running ? currentKw * 1.85 : 0;
    const currentTemp = state.running ? Math.min(85, state.temp + (Math.random() - 0.48) * 0.3) : Math.max(27, state.temp - 0.2);

    const payload = {
      version: 1,
      device_id: gw,
      asset_id: pumpId,
      timestamp: new Date().toISOString(),
      sequence,
      metrics: {
        pump_running: state.running,
        pump_mode: state.mode,
        pump_fault: false,
        flow_m3h: Number(currentFlow.toFixed(2)),
        pressure_bar: Number(currentPressure.toFixed(2)),
        suction_pressure_bar: Number((currentPressure * 0.3).toFixed(2)),
        tank_level_pct: Number(waterLevel.toFixed(1)),
        voltage_v: Number((380 + (Math.random() - 0.5) * 4).toFixed(1)),
        current_a: Number(currentAmp.toFixed(1)),
        power_kw: Number(currentKw.toFixed(2)),
        power_factor: state.running ? 0.88 : 0.0,
        frequency_hz: state.running ? 49.8 + (Math.random() - 0.5) * 0.4 : 0.0,
        motor_temp_c: Number(currentTemp.toFixed(1)),
        vibration_mm_s: state.running ? Number((state.vibration + (Math.random() - 0.5) * 0.1).toFixed(2)) : 0.05,
        rpm: state.running ? 2940 + Math.floor((Math.random() - 0.5) * 20) : 0,
        gateway_uptime_s: Math.floor(process.uptime()),
        signal_rssi: -62,
      },
      quality: 'GOOD',
    };

    client.publish(topic, JSON.stringify(payload), { qos: 1 });
  }

  console.log(`[Simulator] Telemetry published for 6 pumps (Seq #${sequence})`);
}

// Handle Incoming Commands from Fastify
client.on('message', (topic, messageBuffer) => {
  try {
    const payload = JSON.parse(messageBuffer.toString());
    console.log(`📥 [Simulator] Received command on ${topic}:`, payload);

    if (payload.command === 'PUMP_POWER' && payload.asset_id && pumps[payload.asset_id]) {
      const targetState = payload.desired_state === 'ON';
      const pump = pumps[payload.asset_id];

      // Simulate 1.5s PLC execution time
      setTimeout(() => {
        pump.running = targetState;
        if (targetState) {
          pump.flow = 55.0;
          pump.pressure = 4.5;
          pump.kw = 18.5;
        } else {
          pump.flow = 0;
          pump.pressure = 0.2;
          pump.kw = 0;
        }

        const ackTopic = topic.replace('/command', '/command_ack');
        const ackPayload = {
          version: 1,
          command_id: payload.command_id,
          timestamp: new Date().toISOString(),
          asset_id: payload.asset_id,
          status: 'EXECUTED',
          desired_state: payload.desired_state,
          actual_state: payload.desired_state,
          message: `PLC verified safety interlocks and switched ${payload.asset_id} ${payload.desired_state}`,
        };

        client.publish(ackTopic, JSON.stringify(ackPayload), { qos: 1 });
        console.log(`📤 [Simulator] Published Command Acknowledgement to ${ackTopic}:`, ackPayload.status);

        // Immediate telemetry update
        publishTelemetry();
      }, 1500);
    }
  } catch (err: any) {
    console.error('[Simulator] Error processing message:', err.message);
  }
});
