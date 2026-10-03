import mqtt from 'mqtt';
import { env } from '../config/env.js';

async function testSimulatorFlow() {
  console.log('--- Testing Simulator & Ingestion End-to-End ---');
  const baseUrl = 'http://localhost:3000';

  // 1. Login
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ascon.co.id', password: 'Admin@123' }),
  });
  const token = (await loginRes.json()).data.access_token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Start MQTT client to simulate gw-001
  const client = mqtt.connect(env.MQTT_URL, { clientId: 'test-gw-001' });

  await new Promise<void>((resolve) => {
    client.on('connect', () => {
      console.log('✅ Test Simulator connected to MQTT');
      resolve();
    });
  });

  // Subscribe to commands
  const commandTopic = 'swpm/v1/SITE-DEMO/gw-001/command';
  client.subscribe(commandTopic, () => {
    console.log(`📡 Simulator subscribed to ${commandTopic}`);
  });

  client.on('message', async (topic, payloadBuf) => {
    const payload = JSON.parse(payloadBuf.toString());
    console.log('📥 Simulator received command:', payload.command, payload.command_id);

    // Simulate PLC execution and send command_ack
    setTimeout(() => {
      const ackTopic = 'swpm/v1/SITE-DEMO/gw-001/command_ack';
      const ackPayload = {
        version: 1,
        command_id: payload.command_id,
        timestamp: new Date().toISOString(),
        asset_id: payload.asset_id,
        status: 'EXECUTED',
        desired_state: payload.desired_state,
        actual_state: payload.desired_state,
        message: `PLC verified safety interlocks and executed pump ${payload.desired_state}`,
      };
      client.publish(ackTopic, JSON.stringify(ackPayload), { qos: 1 });
      console.log('📤 Simulator sent command_ack: EXECUTED');
    }, 500);
  });

  // 3. Publish Status (Device ONLINE)
  console.log('Publishing Status for gw-001...');
  client.publish(
    'swpm/v1/SITE-DEMO/gw-001/status',
    JSON.stringify({
      version: 1,
      device_id: 'gw-001',
      timestamp: new Date().toISOString(),
      status: 'ONLINE',
      firmware: '1.0.4',
      ip: '192.168.1.100',
      rssi: -60,
      uptime_s: 3600,
    }),
    { qos: 1, retain: true }
  );

  // 4. Publish Telemetry for pump-01
  console.log('Publishing Telemetry for pump-01...');
  client.publish(
    'swpm/v1/SITE-DEMO/gw-001/telemetry',
    JSON.stringify({
      version: 1,
      device_id: 'gw-001',
      asset_id: 'pump-01',
      timestamp: new Date().toISOString(),
      sequence: 101,
      metrics: {
        pump_running: true,
        pump_mode: 'AUTO',
        pump_fault: false,
        flow_m3h: 53.4,
        pressure_bar: 4.25,
        power_kw: 18.5,
        current_a: 32.1,
        motor_temp_c: 48.5,
      },
      quality: 'GOOD',
    }),
    { qos: 1 }
  );

  // Wait 1 second for backend processing
  await new Promise((r) => setTimeout(r, 1000));

  // 5. Query Asset state
  const assetsRes = await fetch(`${baseUrl}/api/v1/assets`, { headers: authHeaders });
  const assets = (await assetsRes.json()).data;
  const p1 = assets.find((a: any) => a.code === 'pump-01');
  console.log('5. Pump-01 state after telemetry:', p1.code, p1.live_status, p1.metrics);

  // 6. Test Pump Command ON -> now device is ONLINE!
  console.log('6. Issuing Pump Power OFF command...');
  const cmdRes = await fetch(`${baseUrl}/api/v1/assets/${p1.id}/commands/power`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      desired_state: 'OFF',
      confirmation: true,
      note: 'Stop pump test',
    }),
  });
  const cmdData = await cmdRes.json();
  console.log('   Command Response:', cmdData);

  // Wait for simulator to ACK
  await new Promise((r) => setTimeout(r, 1000));

  // 7. Check command detail
  const cmdDetailRes = await fetch(`${baseUrl}/api/v1/commands/${cmdData.data.command_id}`, {
    headers: authHeaders,
  });
  const cmdDetail = (await cmdDetailRes.json()).data;
  console.log('7. Final Command Status:', cmdDetail.status, '-', cmdDetail.response_message);

  // 8. Test Alarm Trigger: Publish High Pressure (> 5.5 bar threshold)
  console.log('8. Testing Alarm Trigger with pressure 6.8 bar on pump-01...');
  client.publish(
    'swpm/v1/SITE-DEMO/gw-001/telemetry',
    JSON.stringify({
      version: 1,
      device_id: 'gw-001',
      asset_id: 'pump-01',
      timestamp: new Date().toISOString(),
      metrics: {
        pump_running: true,
        pressure_bar: 6.8, // Triggers HIGH_DISCHARGE_PRESSURE_P01 (threshold > 5.5)
      },
    }),
    { qos: 1 }
  );

  await new Promise((r) => setTimeout(r, 1000));

  // 9. Query Alarms
  const alarmsRes = await fetch(`${baseUrl}/api/v1/alarms?status=OPEN`, { headers: authHeaders });
  const alarms = (await alarmsRes.json()).data;
  console.log('9. Open Alarms Count:', alarms.length);
  if (alarms.length > 0) {
    console.log('   Active Alarm:', alarms[0].rule_name, '| Severity:', alarms[0].severity, '| Message:', alarms[0].message);

    // 10. Acknowledge Alarm
    console.log('10. Acknowledging Alarm...');
    const ackRes = await fetch(`${baseUrl}/api/v1/alarms/${alarms[0].id}/acknowledge`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: 'Operator checked pressure relief valve' }),
    });
    const ackData = await ackRes.json();
    console.log('    Alarm acknowledged status:', ackData.data.status, '| Note:', ackData.data.acknowledgement_note);
  }

  client.end();
  console.log('--- E2E Flow Completed Successfully! ---');
}

testSimulatorFlow().catch(console.error);
