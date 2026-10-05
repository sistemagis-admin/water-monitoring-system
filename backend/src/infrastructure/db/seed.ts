import bcrypt from 'bcryptjs';
import { pool, transaction } from './index.js';
import { ROLE_PERMISSIONS, ROLES, PERMISSIONS } from '../../config/constants.js';

export async function seedDatabase() {
  console.log('========================================================================');
  console.log('🚀 SWPMS Industrial Database Seeding - PT Ascon Multi Pratama');
  console.log('========================================================================');

  await transaction(async (client) => {
    // 1. Seed Permissions
    console.log('1. Seeding RBAC Permissions...');
    for (const perm of PERMISSIONS) {
      await client.query(
        `INSERT INTO permissions (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
        [perm, `Permission for ${perm}`]
      );
    }

    // 2. Seed Roles & Role Permissions
    console.log('2. Seeding Roles & Role Permissions...');
    for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const roleRes = await client.query(
        `INSERT INTO roles (name, description) VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
         RETURNING id`,
        [roleName, `${roleName} Role`]
      );
      const roleId = roleRes.rows[0].id;

      for (const perm of permissions) {
        const permRes = await client.query(`SELECT id FROM permissions WHERE name = $1`, [perm]);
        if (permRes.rows[0]) {
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [roleId, permRes.rows[0].id]
          );
        }
      }
    }

    // 3. Seed Organization
    console.log('3. Seeding Organization (PT Ascon Multi Pratama)...');
    const orgRes = await client.query(
      `INSERT INTO organizations (code, name, status)
       VALUES ('ASCON', 'PT Ascon Multi Pratama', 'ACTIVE')
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`
    );
    const orgId = orgRes.rows[0].id;

    // 4. Seed Project
    console.log('4. Seeding SWPMS Project...');
    const projRes = await client.query(
      `INSERT INTO projects (organization_id, code, name, description, status)
       VALUES ($1, 'SWPMS-PROD', 'Sistem Pemantauan & Otomasi Pompa Air', 'Industrial Telemetry & Pump Automation System', 'ACTIVE')
       ON CONFLICT (organization_id, code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
       RETURNING id`,
      [orgId]
    );
    const projId = projRes.rows[0].id;

    // 5. Seed Site
    console.log('5. Seeding Primary Water Facility (WTP & Distribusi)...');
    const siteRes = await client.query(
      `INSERT INTO sites (project_id, code, name, address, timezone, status)
       VALUES ($1, 'SITE-DEMO', 'Instalasi Pengolahan Air & Distribusi Utama - PT Ascon Multi Pratama', 'Kawasan Industri Cilandak & Bandung, Jawa Barat', 'Asia/Jakarta', 'ACTIVE')
       ON CONFLICT (project_id, code) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address
       RETURNING id`,
      [projId]
    );
    const siteId = siteRes.rows[0].id;

    // 6. Seed Users
    console.log('6. Seeding Users (Admin, Engineer, Operator, Viewer)...');
    const salt = await bcrypt.genSalt(10);
    const usersData = [
      { email: 'admin@ascon.co.id', pass: 'Admin@123', name: 'Super Admin Ascon', role: ROLES.SUPER_ADMIN },
      { email: 'engineer@ascon.co.id', pass: 'Engineer@123', name: 'Field Automation Engineer', role: ROLES.ENGINEER },
      { email: 'operator@ascon.co.id', pass: 'Operator@123', name: 'Plant Operator', role: ROLES.OPERATOR },
      { email: 'viewer@ascon.co.id', pass: 'Viewer@123', name: 'Auditor & Client Viewer', role: ROLES.VIEWER },
    ];

    for (const u of usersData) {
      const hash = await bcrypt.hash(u.pass, salt);
      const userRes = await client.query(
        `INSERT INTO users (email, password_hash, full_name, role, status, site_id)
         VALUES ($1, $2, $3, $4, 'ACTIVE', $5)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name, role = EXCLUDED.role, site_id = EXCLUDED.site_id
         RETURNING id`,
        [u.email, hash, u.name, u.role, siteId]
      );
      const userId = userRes.rows[0].id;

      const roleRes = await client.query(`SELECT id FROM roles WHERE name = $1`, [u.role]);
      if (roleRes.rows[0]) {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userId, roleRes.rows[0].id]
        );
      }
    }

    // 7. Seed Areas / Pump Rooms (3 Realistic Industrial Stations)
    console.log('7. Seeding Stations / Pump Rooms...');
    const roomCodes = [
      {
        code: 'ST-INTAKE',
        name: 'Stasiun Pompa Intake Air Baku (Raw Water Lift)',
        desc: 'Pengambilan air baku dari intake sungai/reservoir primer ke bak prasedimentasi',
      },
      {
        code: 'ST-BOOSTER',
        name: 'Stasiun Pompa Booster Distribusi (Clean Water Booster)',
        desc: 'Pompa dorong bertekanan tinggi langsung ke jaringan pipa distribusi kota (direct inline booster)',
      },
      {
        code: 'ST-RESERVOIR',
        name: 'Stasiun Pompa Transfer & Reservoir Utama',
        desc: 'Transfer air olahan dari reservoir ground level ke tangki elevasi dan penyimpanan cadangan',
      },
    ];

    const areaMap = new Map<string, string>();
    for (const r of roomCodes) {
      const areaRes = await client.query(
        `INSERT INTO areas (site_id, code, name, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (site_id, code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
         RETURNING id`,
        [siteId, r.code, r.name, r.desc]
      );
      areaMap.set(r.code, areaRes.rows[0].id);
    }

    // Clean obsolete areas if any
    await client.query(
      `DELETE FROM areas WHERE site_id = $1 AND code NOT IN ('ST-INTAKE', 'ST-BOOSTER', 'ST-RESERVOIR')`,
      [siteId]
    );

    // 8. Seed IoT Edge Gateways (Panel 1 & Panel 2)
    console.log('8. Seeding IoT Edge Gateways...');
    const devicesData = [
      { code: 'gw-001', name: 'Main Edge Gateway Panel 1 (Intake & Transfer)', area: 'ST-INTAKE' },
      { code: 'gw-002', name: 'Auxiliary Edge Gateway Panel 2 (Booster & Tank)', area: 'ST-BOOSTER' },
    ];
    const deviceMap = new Map<string, string>();
    for (const dev of devicesData) {
      const devRes = await client.query(
        `INSERT INTO mqtt_devices (site_id, area_id, code, name, device_type, status, last_seen_at, firmware_version, ip_address, rssi, uptime_s, config)
         VALUES ($1, $2, $3, $4, 'GATEWAY', 'ONLINE', CURRENT_TIMESTAMP, '2.1.0-ind', '192.168.1.100', -60, 142000, '{"heartbeat_interval": 10, "offline_timeout": 30, "hardware": "Advantech ECU-1251"}'::jsonb)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, status = 'ONLINE', last_seen_at = CURRENT_TIMESTAMP, area_id = EXCLUDED.area_id
         RETURNING id`,
        [siteId, areaMap.get(dev.area), dev.code, dev.name]
      );
      const devId = devRes.rows[0].id;
      deviceMap.set(dev.code, devId);

      // Initialize device_current_state
      await client.query(
        `INSERT INTO device_current_state (device_id, status, last_seen_at, last_telemetry_at, last_status_at, metadata)
         VALUES ($1, 'ONLINE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '{"firmware": "2.1.0-ind", "ip": "192.168.1.100", "rssi": -60}'::jsonb)
         ON CONFLICT (device_id) DO UPDATE SET status = 'ONLINE', last_seen_at = CURRENT_TIMESTAMP`,
        [devId]
      );

      // Seed device credential
      const credHash = await bcrypt.hash('gw_secret_123', salt);
      await client.query(
        `INSERT INTO device_credentials (device_id, username, password_hash, token)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [devId, `${dev.code}_user`, credHash, `token_${dev.code}`]
      );
    }

    // 9. Seed Metric Definitions
    console.log('9. Seeding Metric Definitions...');
    const metricsData = [
      { code: 'pump_running', label: 'Pump Running Status', unit: '', type: 'boolean', cat: 'STATUS', chartable: false, order: 1 },
      { code: 'pump_mode', label: 'Pump Operating Mode', unit: '', type: 'string', cat: 'STATUS', chartable: false, order: 2 },
      { code: 'pump_fault', label: 'Pump Fault Trip', unit: '', type: 'boolean', cat: 'STATUS', chartable: false, order: 3 },
      { code: 'flow_m3h', label: 'Discharge Flow Rate', unit: 'm³/h', type: 'number', cat: 'HYDRAULIC', min: 0, max: 250, chartable: true, order: 4 },
      { code: 'pressure_bar', label: 'Discharge Pressure', unit: 'bar', type: 'number', cat: 'HYDRAULIC', min: 0, max: 16, chartable: true, order: 5 },
      { code: 'suction_pressure_bar', label: 'Suction Pressure', unit: 'bar', type: 'number', cat: 'HYDRAULIC', min: 0, max: 10, chartable: true, order: 6 },
      { code: 'tank_level_pct', label: 'Reservoir Water Level', unit: '%', type: 'number', cat: 'HYDRAULIC', min: 0, max: 100, chartable: true, order: 7 },
      { code: 'water_temp_c', label: 'Water Temperature', unit: '°C', type: 'number', cat: 'PROCESS', min: 0, max: 100, chartable: true, order: 8 },
      { code: 'voltage_v', label: '3-Phase Supply Voltage', unit: 'V', type: 'number', cat: 'ELECTRICAL', min: 0, max: 500, chartable: true, order: 9 },
      { code: 'current_a', label: 'Motor Current Draw', unit: 'A', type: 'number', cat: 'ELECTRICAL', min: 0, max: 150, chartable: true, order: 10 },
      { code: 'power_kw', label: 'Motor Active Power', unit: 'kW', type: 'number', cat: 'ENERGY', min: 0, max: 100, chartable: true, order: 11 },
      { code: 'power_factor', label: 'Cos Phi Power Factor', unit: '', type: 'number', cat: 'ELECTRICAL', min: 0, max: 1, chartable: true, order: 12 },
      { code: 'frequency_hz', label: 'VFD Inverter Frequency', unit: 'Hz', type: 'number', cat: 'ELECTRICAL', min: 0, max: 60, chartable: true, order: 13 },
      { code: 'energy_kwh', label: 'Cumulative Energy Consumption', unit: 'kWh', type: 'number', cat: 'ENERGY', min: 0, max: 10000000, chartable: true, order: 14 },
      { code: 'motor_temp_c', label: 'Motor Bearing Temperature', unit: '°C', type: 'number', cat: 'MOTOR', min: 0, max: 150, chartable: true, order: 15 },
      { code: 'vibration_mm_s', label: 'Vibration RMS Velocity', unit: 'mm/s', type: 'number', cat: 'MOTOR', min: 0, max: 25, chartable: true, order: 16 },
      { code: 'rpm', label: 'Motor Shaft Speed', unit: 'RPM', type: 'number', cat: 'MOTOR', min: 0, max: 3600, chartable: true, order: 17 },
    ];

    for (const m of metricsData) {
      await client.query(
        `INSERT INTO metric_definitions (code, label, unit, data_type, category, min_value, max_value, chartable, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, unit = EXCLUDED.unit, category = EXCLUDED.category`,
        [m.code, m.label, m.unit, m.type, m.cat, m.min ?? null, m.max ?? null, m.chartable, m.order]
      );
    }

    // 10. Seed 6 Professional Industrial Pumps
    console.log('10. Seeding 6 Industrial Pumps Across 3 Stations...');
    const pumpsData = [
      // ST-INTAKE (Raw Water Intake Lift Station)
      { code: 'P-101', name: 'Pompa Intake Submersible 01', room: 'ST-INTAKE', gw: 'gw-001', subtype: 'MAIN_PUMP', kw: 37.0, flow: 120.0, press: 4.2, status: 'RUNNING' },
      { code: 'P-102', name: 'Pompa Intake Submersible 02', room: 'ST-INTAKE', gw: 'gw-001', subtype: 'MAIN_PUMP', kw: 37.0, flow: 120.0, press: 4.2, status: 'STOPPED' },
      // ST-BOOSTER (Direct High-Pressure Booster Station)
      { code: 'P-201', name: 'Pompa Booster Distribusi 01', room: 'ST-BOOSTER', gw: 'gw-002', subtype: 'BOOSTER_PUMP', kw: 45.0, flow: 160.0, press: 6.5, status: 'RUNNING' },
      { code: 'P-202', name: 'Pompa Booster Distribusi 02', room: 'ST-BOOSTER', gw: 'gw-002', subtype: 'BOOSTER_PUMP', kw: 45.0, flow: 160.0, press: 6.5, status: 'RUNNING' },
      // ST-RESERVOIR (Clear Water Storage & Transfer Station)
      { code: 'P-301', name: 'Pompa Transfer Reservoir 01', room: 'ST-RESERVOIR', gw: 'gw-001', subtype: 'TRANSFER_PUMP', kw: 30.0, flow: 95.0, press: 5.2, status: 'RUNNING' },
      { code: 'P-302', name: 'Pompa Transfer Reservoir 02', room: 'ST-RESERVOIR', gw: 'gw-001', subtype: 'TRANSFER_PUMP', kw: 30.0, flow: 95.0, press: 5.2, status: 'STOPPED' },
    ];

    const assetMap = new Map<string, string>();
    for (const p of pumpsData) {
      const isRunning = p.status === 'RUNNING';
      const assetRes = await client.query(
        `INSERT INTO assets (site_id, area_id, device_id, code, name, asset_type, asset_subtype, status, metadata)
         VALUES ($1, $2, $3, $4, $5, 'PUMP', $6, $7, $8)
         ON CONFLICT (site_id, code) DO UPDATE SET
           name = EXCLUDED.name,
           area_id = EXCLUDED.area_id,
           device_id = EXCLUDED.device_id,
           status = EXCLUDED.status,
           metadata = EXCLUDED.metadata
         RETURNING id`,
        [
          siteId,
          areaMap.get(p.room),
          deviceMap.get(p.gw),
          p.code,
          p.name,
          p.subtype,
          p.status,
          JSON.stringify({
            manufacturer: 'Grundfos CR-N Series / Ebara Industrial',
            model: `SWP-${p.kw}KW-IND`,
            rated_power_kw: p.kw,
            rated_flow_m3h: p.flow,
            rated_pressure_bar: p.press,
            control_enabled: true,
            power_command: true,
            remote_control_allowed: true,
            commands: ['PUMP_POWER', 'SET_PUMP_MODE'],
          }),
        ]
      );
      const assetId = assetRes.rows[0].id;
      assetMap.set(p.code, assetId);

      // Calculate initial realistic metrics
      const currentFlow = isRunning ? p.flow * 0.96 : 0;
      const currentPress = isRunning ? p.press * 0.98 : 0.2;
      const currentKw = isRunning ? p.kw * 0.92 : 0;
      const currentAmp = isRunning ? currentKw * 1.82 : 0;
      const currentTemp = isRunning ? 52.4 : 27.5;
      const currentVib = isRunning ? 1.35 : 0.04;
      const currentFreq = isRunning ? 50.0 : 0.0;
      const currentRpm = isRunning ? 2950 : 0;

      await client.query(
        `INSERT INTO asset_current_state (asset_id, last_timestamp, status, metrics, quality, control_enabled, commandable, updated_at)
         VALUES ($1, CURRENT_TIMESTAMP, $2, $3, 'GOOD', true, true, CURRENT_TIMESTAMP)
         ON CONFLICT (asset_id) DO UPDATE SET
           status = EXCLUDED.status,
           control_enabled = true,
           commandable = true,
           metrics = EXCLUDED.metrics,
           updated_at = CURRENT_TIMESTAMP`,
        [
          assetId,
          p.status,
          JSON.stringify({
            pump_running: isRunning,
            pump_mode: 'AUTO',
            pump_fault: false,
            flow_m3h: Number(currentFlow.toFixed(1)),
            pressure_bar: Number(currentPress.toFixed(2)),
            suction_pressure_bar: Number((currentPress * 0.35).toFixed(2)),
            power_kw: Number(currentKw.toFixed(1)),
            current_a: Number(currentAmp.toFixed(1)),
            voltage_v: 382.0,
            power_factor: isRunning ? 0.88 : 0.0,
            frequency_hz: currentFreq,
            motor_temp_c: currentTemp,
            vibration_mm_s: currentVib,
            rpm: currentRpm,
            energy_kwh: Math.floor(12400 + Math.random() * 4000),
          }),
        ]
      );
    }

    // Clean old obsolete assets
    await client.query(
      `DELETE FROM assets WHERE site_id = $1 AND code NOT IN ('P-101', 'P-102', 'P-201', 'P-202', 'P-301', 'P-302')`,
      [siteId]
    );

    // 11. Seed Sensors and Bindings
    console.log('11. Seeding Sensors & Industrial Bindings...');
    for (const p of pumpsData) {
      const assetId = assetMap.get(p.code)!;
      const devId = deviceMap.get(p.gw)!;

      const sensorsList = [
        { code: `FM-${p.code}`, name: `Flow Meter ${p.code}`, type: 'FLOW_METER', metric: 'flow_m3h', unit: 'm³/h', role: 'DISCHARGE_FLOW' },
        { code: `PT-${p.code}`, name: `Pressure Transmitter ${p.code}`, type: 'PRESSURE_SENSOR', metric: 'pressure_bar', unit: 'bar', role: 'DISCHARGE_PRESSURE' },
        { code: `PM-${p.code}`, name: `Power Transducer ${p.code}`, type: 'POWER_METER', metric: 'power_kw', unit: 'kW', role: 'MOTOR_POWER' },
        { code: `CT-${p.code}`, name: `Current Sensor ${p.code}`, type: 'CURRENT_SENSOR', metric: 'current_a', unit: 'A', role: 'MOTOR_CURRENT' },
        { code: `VT-${p.code}`, name: `Voltage Monitor ${p.code}`, type: 'VOLTAGE_SENSOR', metric: 'voltage_v', unit: 'V', role: 'SUPPLY_VOLTAGE' },
        { code: `VFD-${p.code}`, name: `Inverter Frequency ${p.code}`, type: 'FREQUENCY_SENSOR', metric: 'frequency_hz', unit: 'Hz', role: 'VFD_FREQUENCY' },
        { code: `TT-${p.code}`, name: `Stator Temp Sensor ${p.code}`, type: 'TEMPERATURE_SENSOR', metric: 'motor_temp_c', unit: '°C', role: 'MOTOR_TEMPERATURE' },
        { code: `VIB-${p.code}`, name: `Vibration Sensor ${p.code}`, type: 'VIBRATION_SENSOR', metric: 'vibration_mm_s', unit: 'mm/s', role: 'BEARING_VIBRATION' },
      ];

      for (const s of sensorsList) {
        const sRes = await client.query(
          `INSERT INTO sensors (site_id, device_id, code, name, sensor_type, metric_code, status, unit)
           VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7)
           ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, unit = EXCLUDED.unit
           RETURNING id`,
          [siteId, devId, s.code, s.name, s.type, s.metric, s.unit]
        );
        const sensorId = sRes.rows[0].id;

        await client.query(
          `INSERT INTO sensor_bindings (sensor_id, asset_id, role, active, effective_from)
           VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
           ON CONFLICT DO NOTHING`,
          [sensorId, assetId, s.role]
        );
      }
    }

    // Area-specific Reservoir Level Sensors
    const areaLevelSensors = [
      { areaCode: 'ST-INTAKE', sensorCode: 'LT-INTAKE-01', name: 'Ultrasonic Level Sensor Bak Intake Air Baku' },
      { areaCode: 'ST-RESERVOIR', sensorCode: 'LT-RESERV-01', name: 'Hydrostatic Level Sensor Tangki Reservoir Distribusi' },
    ];

    for (const lvl of areaLevelSensors) {
      const areaId = areaMap.get(lvl.areaCode)!;
      const devId = deviceMap.get('gw-001')!;

      const lvlRes = await client.query(
        `INSERT INTO sensors (site_id, device_id, code, name, sensor_type, metric_code, status, unit)
         VALUES ($1, $2, $3, $4, 'LEVEL_SENSOR', 'tank_level_pct', 'ACTIVE', '%')
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [siteId, devId, lvl.sensorCode, lvl.name]
      );
      const sensorId = lvlRes.rows[0].id;

      await client.query(
        `INSERT INTO sensor_bindings (sensor_id, area_id, role, active, effective_from)
         VALUES ($1, $2, 'WATER_LEVEL', true, CURRENT_TIMESTAMP)
         ON CONFLICT DO NOTHING`,
        [sensorId, areaId]
      );
    }

    // 12. Seed 24-Hour Realistic Historical Telemetry Samples
    console.log('12. Generating 24-Hour Historical Telemetry Readings...');
    const now = Date.now();
    const fifteenMinMs = 15 * 60 * 1000;
    const totalPoints = 96; // 96 samples = 24 hours of 15m intervals

    for (let i = totalPoints; i >= 0; i--) {
      const pointTime = new Date(now - i * fifteenMinMs);
      const hourOfDay = pointTime.getHours() + pointTime.getMinutes() / 60;

      // Realistic diurnal water demand curve (peaks at 07:00 & 19:00, trough at 02:00)
      const diurnal = Math.sin(((hourOfDay - 3) / 24) * 2 * Math.PI) * 0.35 + 0.95;
      const noise = (Math.random() - 0.5) * 0.08;
      const levelSin = Math.sin((hourOfDay / 24) * 2 * Math.PI) * 12 + 76;

      for (const p of pumpsData) {
        const assetId = assetMap.get(p.code)!;
        const devId = deviceMap.get(p.gw)!;
        const isRunning = p.status === 'RUNNING';

        const flowVal = isRunning ? Number((p.flow * (diurnal + noise)).toFixed(1)) : 0.0;
        const pressVal = isRunning ? Number((p.press * (1 + noise * 0.4)).toFixed(2)) : 0.2;
        const kwVal = isRunning ? Number((p.kw * (diurnal * 0.9 + 0.1 + noise)).toFixed(1)) : 0.0;
        const ampVal = isRunning ? Number((kwVal * 1.82).toFixed(1)) : 0.0;
        const tempVal = isRunning ? Number((48 + diurnal * 8 + noise * 3).toFixed(1)) : 27.0;

        const samplePayload = {
          version: 1,
          device_id: p.gw,
          asset_id: p.code,
          timestamp: pointTime.toISOString(),
          metrics: {
            pump_running: isRunning,
            flow_m3h: flowVal,
            pressure_bar: pressVal,
            power_kw: kwVal,
            current_a: ampVal,
            voltage_v: Number((380 + noise * 10).toFixed(1)),
            frequency_hz: isRunning ? 50.0 : 0.0,
            motor_temp_c: tempVal,
            tank_level_pct: Number((levelSin + noise * 2).toFixed(1)),
          },
          quality: 'GOOD',
        };

        await client.query(
          `INSERT INTO telemetry_samples (site_id, source_device_id, asset_id, device_timestamp, received_at, sequence, quality, payload)
           VALUES ($1, $2, $3, $4, $4, $5, 'GOOD', $6)`,
          [siteId, devId, assetId, pointTime, 1000 + (totalPoints - i), JSON.stringify(samplePayload)]
        );
      }
    }

    // 13. Seed Alarm Rules
    console.log('13. Seeding Industrial Alarm Rules...');
    const alarmRules = [
      { code: 'ALM_P101_HIGH_PRESS', name: 'Pompa Intake 01 Tekanan Tinggi', asset: 'P-101', metric: 'pressure_bar', op: '>', val: 5.5, sev: 'HIGH', delay: 5, rec: 5 },
      { code: 'ALM_P201_HIGH_TEMP', name: 'Pompa Booster 01 Suhu Motor Berlebih', asset: 'P-201', metric: 'motor_temp_c', op: '>', val: 75.0, sev: 'CRITICAL', delay: 5, rec: 30 },
      { code: 'ALM_P202_OVERCURRENT', name: 'Pompa Booster 02 Overcurrent Trip', asset: 'P-202', metric: 'current_a', op: '>', val: 85.0, sev: 'HIGH', delay: 3, rec: 10 },
      { code: 'ALM_RESERV_LOW_LEVEL', name: 'Reservoir Air Baku Tingkat Rendah', asset: null, metric: 'tank_level_pct', op: '<', val: 25.0, sev: 'CRITICAL', delay: 10, rec: 15 },
    ];

    for (const rule of alarmRules) {
      await client.query(
        `INSERT INTO alarm_rules (code, name, site_id, asset_id, metric_code, rule_type, operator, threshold, severity, delay_seconds, recovery_seconds, enabled)
         VALUES ($1, $2, $3, $4, $5, 'THRESHOLD', $6, $7, $8, $9, $10, true)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, threshold = EXCLUDED.threshold`,
        [
          rule.code,
          rule.name,
          siteId,
          rule.asset ? assetMap.get(rule.asset) : null,
          rule.metric,
          rule.op,
          rule.val,
          rule.sev,
          rule.delay,
          rule.rec,
        ]
      );
    }

    console.log('========================================================================');
    console.log('✅ Industrial Database Seeding Complete!');
    console.log('📍 3 Stations: ST-INTAKE, ST-BOOSTER, ST-RESERVOIR');
    console.log('⚡ 6 Industrial Pumps: P-101, P-102, P-201, P-202, P-301, P-302');
    console.log('📡 2 Gateways: gw-001, gw-002 (ONLINE)');
    console.log('📊 96 Historical Telemetry Data Points Generated (24h)');
    console.log('========================================================================');
  });
}

if (process.argv[1]?.includes('seed.ts')) {
  seedDatabase()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}
