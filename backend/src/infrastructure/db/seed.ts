import bcrypt from 'bcryptjs';
import { pool, query, transaction } from './index.js';
import { ROLE_PERMISSIONS, ROLES, PERMISSIONS } from '../../config/constants.js';

export async function seedDatabase() {
  console.log('--- Starting Database Seeding ---');

  await transaction(async (client) => {
    // 1. Seed Permissions
    console.log('Seeding Permissions...');
    for (const perm of PERMISSIONS) {
      await client.query(
        `INSERT INTO permissions (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
        [perm, `Permission for ${perm}`]
      );
    }

    // 2. Seed Roles & Role Permissions
    console.log('Seeding Roles & Role Permissions...');
    for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const roleRes = await client.query(
        `INSERT INTO roles (name, description) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id`,
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
    console.log('Seeding Organization...');
    const orgRes = await client.query(
      `INSERT INTO organizations (code, name, status)
       VALUES ('ASCON', 'PT Ascon Multi Pratama', 'ACTIVE')
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`
    );
    const orgId = orgRes.rows[0].id;

    // 4. Seed Project
    console.log('Seeding Project...');
    const projRes = await client.query(
      `INSERT INTO projects (organization_id, code, name, description, status)
       VALUES ($1, 'SWPMS-DEMO', 'Smart Water Pump Monitoring Demo', 'SCADA & IoT Water Treatment Plant Demo', 'ACTIVE')
       ON CONFLICT (organization_id, code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [orgId]
    );
    const projId = projRes.rows[0].id;

    // 5. Seed Site
    console.log('Seeding Site...');
    const siteRes = await client.query(
      `INSERT INTO sites (project_id, code, name, address, timezone, status)
       VALUES ($1, 'SITE-DEMO', 'WTP Plant Bandung', 'Jl. Ascon Engineering No. 8, Bandung, Jawa Barat', 'Asia/Jakarta', 'ACTIVE')
       ON CONFLICT (project_id, code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [projId]
    );
    const siteId = siteRes.rows[0].id;

    // 6. Seed Users
    console.log('Seeding Users...');
    const salt = await bcrypt.genSalt(10);
    const usersData = [
      { email: 'admin@ascon.co.id', pass: 'Admin@123', name: 'Super Admin Ascon', role: ROLES.SUPER_ADMIN },
      { email: 'engineer@ascon.co.id', pass: 'Engineer@123', name: 'Field SCADA Engineer', role: ROLES.ENGINEER },
      { email: 'operator@ascon.co.id', pass: 'Operator@123', name: 'Plant Operator', role: ROLES.OPERATOR },
      { email: 'viewer@ascon.co.id', pass: 'Viewer@123', name: 'Client Auditor / Viewer', role: ROLES.VIEWER },
    ];

    for (const u of usersData) {
      const hash = await bcrypt.hash(u.pass, salt);
      const userRes = await client.query(
        `INSERT INTO users (email, password_hash, full_name, role, status, site_id)
         VALUES ($1, $2, $3, $4, 'ACTIVE', $5)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name, role = EXCLUDED.role
         RETURNING id`,
        [u.email, hash, u.name, u.role, siteId]
      );
      const userId = userRes.rows[0].id;

      // Assign user role
      const roleRes = await client.query(`SELECT id FROM roles WHERE name = $1`, [u.role]);
      if (roleRes.rows[0]) {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userId, roleRes.rows[0].id]
        );
      }
    }

    // 7. Seed Areas (3 Rooms per Section 20.1)
    console.log('Seeding Areas/Rooms...');
    const roomCodes = [
      { code: 'ROOM-01', name: 'Pump Room 01 (Intake / Raw Water)', desc: 'Primary intake pump area' },
      { code: 'ROOM-02', name: 'Pump Room 02 (Treatment / Filtration)', desc: 'Filtration and chemical dosing pump area' },
      { code: 'ROOM-03', name: 'Pump Room 03 (Distribution / Booster)', desc: 'Treated water distribution high-pressure booster' },
    ];
    const areaMap = new Map<string, string>();
    for (const r of roomCodes) {
      const areaRes = await client.query(
        `INSERT INTO areas (site_id, code, name, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (site_id, code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [siteId, r.code, r.name, r.desc]
      );
      areaMap.set(r.code, areaRes.rows[0].id);
    }

    // 8. Seed MQTT Devices (Gateways GW-001 & GW-002)
    console.log('Seeding MQTT Devices...');
    const devicesData = [
      { code: 'gw-001', name: 'Main IoT Edge Gateway Panel 1', area: 'ROOM-01' },
      { code: 'gw-002', name: 'Auxiliary IoT Edge Gateway Panel 2', area: 'ROOM-03' },
    ];
    const deviceMap = new Map<string, string>();
    for (const dev of devicesData) {
      const devRes = await client.query(
        `INSERT INTO mqtt_devices (site_id, area_id, code, name, device_type, status, last_seen_at, firmware_version, ip_address, rssi, uptime_s, config)
         VALUES ($1, $2, $3, $4, 'GATEWAY', 'ONLINE', CURRENT_TIMESTAMP, '1.0.4', '192.168.1.100', -62, 86400, '{"heartbeat_interval": 10, "offline_timeout": 30}'::jsonb)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status, last_seen_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [siteId, areaMap.get(dev.area), dev.code, dev.name]
      );
      const devId = devRes.rows[0].id;
      deviceMap.set(dev.code, devId);

      // Initialize device_current_state
      await client.query(
        `INSERT INTO device_current_state (device_id, status, last_seen_at, last_telemetry_at, last_status_at, metadata)
         VALUES ($1, 'ONLINE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '{"firmware": "1.0.4", "ip": "192.168.1.100", "rssi": -62}'::jsonb)
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

    // 9. Seed Metric Definitions (Appendix A)
    console.log('Seeding Metric Definitions...');
    const metricsData = [
      { code: 'pump_running', label: 'Pump Running Status', unit: '', type: 'boolean', cat: 'STATUS', chartable: false, order: 1 },
      { code: 'pump_mode', label: 'Pump Operating Mode', unit: '', type: 'string', cat: 'STATUS', chartable: false, order: 2 },
      { code: 'pump_fault', label: 'Pump Fault Status', unit: '', type: 'boolean', cat: 'STATUS', chartable: false, order: 3 },
      { code: 'flow_m3h', label: 'Flow Rate', unit: 'm³/h', type: 'number', cat: 'HYDRAULIC', min: 0, max: 200, chartable: true, order: 4 },
      { code: 'pressure_bar', label: 'Discharge Pressure', unit: 'bar', type: 'number', cat: 'HYDRAULIC', min: 0, max: 16, chartable: true, order: 5 },
      { code: 'suction_pressure_bar', label: 'Suction Pressure', unit: 'bar', type: 'number', cat: 'HYDRAULIC', min: 0, max: 10, chartable: true, order: 6 },
      { code: 'tank_level_pct', label: 'Tank Water Level', unit: '%', type: 'number', cat: 'HYDRAULIC', min: 0, max: 100, chartable: true, order: 7 },
      { code: 'tank_distance_m', label: 'Tank Ultrasonic Distance', unit: 'm', type: 'number', cat: 'HYDRAULIC', min: 0, max: 10, chartable: true, order: 8 },
      { code: 'water_temp_c', label: 'Water Temperature', unit: '°C', type: 'number', cat: 'PROCESS', min: 0, max: 100, chartable: true, order: 9 },
      { code: 'voltage_v', label: 'Supply Voltage', unit: 'V', type: 'number', cat: 'ELECTRICAL', min: 0, max: 500, chartable: true, order: 10 },
      { code: 'current_a', label: 'Motor Current', unit: 'A', type: 'number', cat: 'ELECTRICAL', min: 0, max: 100, chartable: true, order: 11 },
      { code: 'power_kw', label: 'Active Power', unit: 'kW', type: 'number', cat: 'ENERGY', min: 0, max: 55, chartable: true, order: 12 },
      { code: 'power_factor', label: 'Power Factor', unit: '', type: 'number', cat: 'ELECTRICAL', min: 0, max: 1, chartable: true, order: 13 },
      { code: 'frequency_hz', label: 'VFD Frequency', unit: 'Hz', type: 'number', cat: 'ELECTRICAL', min: 0, max: 60, chartable: true, order: 14 },
      { code: 'energy_kwh', label: 'Total Energy Consumption', unit: 'kWh', type: 'number', cat: 'ENERGY', min: 0, max: 1000000, chartable: true, order: 15 },
      { code: 'motor_temp_c', label: 'Motor Temperature', unit: '°C', type: 'number', cat: 'MOTOR', min: 0, max: 150, chartable: true, order: 16 },
      { code: 'vibration_mm_s', label: 'Vibration RMS', unit: 'mm/s', type: 'number', cat: 'MOTOR', min: 0, max: 25, chartable: true, order: 17 },
      { code: 'rpm', label: 'Pump Speed', unit: 'RPM', type: 'number', cat: 'MOTOR', min: 0, max: 3600, chartable: true, order: 18 },
      { code: 'vfd_fault_code', label: 'VFD Fault Code', unit: '', type: 'string', cat: 'MOTOR', chartable: false, order: 19 },
      { code: 'gateway_uptime_s', label: 'Gateway Uptime', unit: 's', type: 'number', cat: 'DEVICE', chartable: false, order: 20 },
      { code: 'signal_rssi', label: 'Cellular/WiFi Signal', unit: 'dBm', type: 'number', cat: 'DEVICE', chartable: true, order: 21 },
    ];

    for (const m of metricsData) {
      await client.query(
        `INSERT INTO metric_definitions (code, label, unit, data_type, category, min_value, max_value, chartable, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, unit = EXCLUDED.unit, category = EXCLUDED.category`,
        [m.code, m.label, m.unit, m.type, m.cat, m.min ?? null, m.max ?? null, m.chartable, m.order]
      );
    }

    // 10. Seed Assets (6 Initial Pumps per Section 20.1 & Appendix B)
    console.log('Seeding Assets (6 Initial Pumps)...');
    const pumpsData = [
      { code: 'pump-01', name: 'Raw Water Intake Pump 01', room: 'ROOM-01', gw: 'gw-001', subtype: 'MAIN_PUMP', kw: 18.5, flow: 55, press: 4.5 },
      { code: 'pump-02', name: 'Raw Water Intake Pump 02', room: 'ROOM-01', gw: 'gw-001', subtype: 'MAIN_PUMP', kw: 18.5, flow: 55, press: 4.5 },
      { code: 'pump-03', name: 'Filtration Feed Pump 03', room: 'ROOM-02', gw: 'gw-001', subtype: 'TRANSFER_PUMP', kw: 22.0, flow: 65, press: 5.0 },
      { code: 'pump-04', name: 'Filtration Feed Pump 04', room: 'ROOM-02', gw: 'gw-001', subtype: 'TRANSFER_PUMP', kw: 22.0, flow: 65, press: 5.0 },
      { code: 'pump-05', name: 'Treated Water Booster Pump 05', room: 'ROOM-03', gw: 'gw-002', subtype: 'BOOSTER_PUMP', kw: 30.0, flow: 80, press: 6.5 },
      { code: 'pump-06', name: 'Treated Water Booster Pump 06', room: 'ROOM-03', gw: 'gw-002', subtype: 'BOOSTER_PUMP', kw: 30.0, flow: 80, press: 6.5 },
    ];

    const assetMap = new Map<string, string>();
    for (const p of pumpsData) {
      const assetRes = await client.query(
        `INSERT INTO assets (site_id, area_id, device_id, code, name, asset_type, asset_subtype, status, metadata)
         VALUES ($1, $2, $3, $4, $5, 'PUMP', $6, 'RUNNING', $7)
         ON CONFLICT (site_id, code) DO UPDATE SET name = EXCLUDED.name, metadata = EXCLUDED.metadata
         RETURNING id`,
        [
          siteId,
          areaMap.get(p.room),
          deviceMap.get(p.gw),
          p.code,
          p.name,
          p.subtype,
          JSON.stringify({
            manufacturer: 'Grundfos / Ebara',
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

      // Seed initial asset_current_state
      await client.query(
        `INSERT INTO asset_current_state (asset_id, last_timestamp, status, metrics, quality, control_enabled, commandable, updated_at)
         VALUES ($1, CURRENT_TIMESTAMP, 'RUNNING', $2, 'GOOD', true, true, CURRENT_TIMESTAMP)
         ON CONFLICT (asset_id) DO UPDATE SET
           status = 'RUNNING',
           control_enabled = true,
           commandable = true,
           metrics = EXCLUDED.metrics,
           updated_at = CURRENT_TIMESTAMP`,
        [
          assetId,
          JSON.stringify({
            pump_running: true,
            pump_mode: 'AUTO',
            pump_fault: false,
            flow_m3h: p.flow * 0.95,
            pressure_bar: p.press * 0.92,
            voltage_v: 382.5,
            current_a: (p.kw * 1.8),
            power_kw: p.kw * 0.88,
            frequency_hz: 49.5,
            motor_temp_c: 48.2,
            vibration_mm_s: 1.4,
            rpm: 2950,
          }),
        ]
      );
    }

    // 11. Seed Sensors and Sensor Bindings
    console.log('Seeding Sensors & Bindings...');
    // Pump-specific sensors
    for (const p of pumpsData) {
      const assetId = assetMap.get(p.code)!;
      const devId = deviceMap.get(p.gw)!;

      const sensorsList = [
        { code: `FM-${p.code.toUpperCase()}`, name: `Flow Meter ${p.code.toUpperCase()}`, type: 'FLOW_METER', metric: 'flow_m3h', unit: 'm³/h', role: 'DISCHARGE_FLOW' },
        { code: `PT-${p.code.toUpperCase()}`, name: `Pressure Transmitter ${p.code.toUpperCase()}`, type: 'PRESSURE_SENSOR', metric: 'pressure_bar', unit: 'bar', role: 'DISCHARGE_PRESSURE' },
        { code: `TT-${p.code.toUpperCase()}`, name: `Temp Sensor ${p.code.toUpperCase()}`, type: 'TEMPERATURE_SENSOR', metric: 'motor_temp_c', unit: '°C', role: 'MOTOR_TEMPERATURE' },
      ];

      for (const s of sensorsList) {
        const sRes = await client.query(
          `INSERT INTO sensors (site_id, device_id, code, name, sensor_type, metric_code, status, unit)
           VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7)
           ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
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

    // Area-specific sensors (Tank water levels per room)
    for (const r of roomCodes) {
      const areaId = areaMap.get(r.code)!;
      const devId = deviceMap.get('gw-001')!;
      const lvlCode = `LT-${r.code.replace('-', '')}`;

      const lvlRes = await client.query(
        `INSERT INTO sensors (site_id, device_id, code, name, sensor_type, metric_code, status, unit)
         VALUES ($1, $2, $3, $4, 'LEVEL_SENSOR', 'tank_level_pct', 'ACTIVE', '%')
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [siteId, devId, lvlCode, `Reservoir Level Transmitter ${r.name}`]
      );
      const sensorId = lvlRes.rows[0].id;

      await client.query(
        `INSERT INTO sensor_bindings (sensor_id, area_id, role, active, effective_from)
         VALUES ($1, $2, 'WATER_LEVEL', true, CURRENT_TIMESTAMP)
         ON CONFLICT DO NOTHING`,
        [sensorId, areaId]
      );
    }

    // 12. Seed Alarm Rules
    console.log('Seeding Alarm Rules...');
    const alarmRules = [
      {
        code: 'HIGH_DISCHARGE_PRESSURE_P01',
        name: 'Pump 01 High Discharge Pressure',
        asset: 'pump-01',
        metric: 'pressure_bar',
        op: '>',
        val: 5.5,
        sev: 'HIGH',
        delay: 5,
        rec: 5,
      },
      {
        code: 'LOW_RESERVOIR_LEVEL_R01',
        name: 'Room 01 Low Reservoir Level',
        asset: null,
        metric: 'tank_level_pct',
        op: '<',
        val: 20.0,
        sev: 'CRITICAL',
        delay: 10,
        rec: 15,
      },
      {
        code: 'HIGH_MOTOR_TEMP_P03',
        name: 'Pump 03 Motor Overheat',
        asset: 'pump-03',
        metric: 'motor_temp_c',
        op: '>',
        val: 75.0,
        sev: 'CRITICAL',
        delay: 5,
        rec: 30,
      },
      {
        code: 'OVERCURRENT_P05',
        name: 'Pump 05 Motor Overcurrent',
        asset: 'pump-05',
        metric: 'current_a',
        op: '>',
        val: 65.0,
        sev: 'HIGH',
        delay: 3,
        rec: 10,
      },
      {
        code: 'PUMP_FAULT_P02',
        name: 'Pump 02 Hardware Fault Tripped',
        asset: 'pump-02',
        metric: 'pump_fault',
        op: '==',
        val: 1,
        sev: 'CRITICAL',
        delay: 0,
        rec: 0,
      },
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

    console.log('--- Database Seeding Completed Successfully ---');
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
