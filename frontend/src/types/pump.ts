export type PumpStatus = 'RUNNING' | 'STOPPED' | 'FAULT' | 'MAINTENANCE' | 'OFFLINE'
export type AlarmSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type AlarmStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'
export type CommandState = 'IDLE' | 'PENDING' | 'SENT' | 'EXECUTED' | 'REJECTED' | 'TIMEOUT'

export interface PumpAsset {
  id: string
  code: string // e.g., 'P-01'
  name: string
  areaId: string
  areaName: string
  motorIndex: 0 | 1 // M1 or M2
  status: PumpStatus
  controlEnabled: boolean
  remoteAllowed: boolean
  commandState: CommandState
  metrics: {
    pressure_bar: number
    flow_m3h: number
    tank_level_pct: number
    power_kw: number
    current_a: number
    voltage_v: number
    frequency_hz: number
    motor_temp_c: number
    energy_kwh: number
  }
}

export interface LocationStation {
  id: string
  code: string
  name: string
  number: string
  sensorTag: string
  basePressure: number
  baseFlow: number
  motors: [number, number]
  color: string
  tankLevel: number
  pumps: [PumpAsset, PumpAsset]
  pressure: number
  flowRate: number
  history: {
    pressure: number[]
    flowRate: number[]
    power: number[]
  }
}

export type AreaRoom = LocationStation

export interface AlarmItem {
  id: string
  code: string
  assetId: string
  assetName: string
  areaName: string
  metricCode: string
  severity: AlarmSeverity
  status: AlarmStatus
  message: string
  value: number
  unit: string
  threshold: number
  openedAt: string
  acknowledgedAt?: string
  acknowledgedBy?: string
}

export interface DeviceGateway {
  id: string
  code: string
  name: string
  siteId: string
  status: 'ONLINE' | 'STALE' | 'OFFLINE'
  lastSeen: string
  firmware: string
  rssi: number
  ip: string
}

export type PumpSubtype =
  | 'MAIN_PUMP'
  | 'TRANSFER_PUMP'
  | 'BOOSTER_PUMP'
  | 'HEATER_PUMP'
  | 'AUXILIARY_PUMP'

export type SensorType =
  | 'PRESSURE_SENSOR'
  | 'FLOW_METER'
  | 'LEVEL_SENSOR'
  | 'DISTANCE_SENSOR'
  | 'TEMPERATURE_SENSOR'
  | 'CURRENT_SENSOR'
  | 'VIBRATION_SENSOR'
  | 'OTHER'

export interface SensorItem {
  id: string
  code: string
  name: string
  sensorType: SensorType
  metricCode: string
  unit: string
  targetType: 'AREA' | 'PUMP'
  targetId: string
  targetName: string
  deviceId: string
  status: 'ACTIVE' | 'CALIBRATING' | 'FAULT' | 'OFFLINE'
  currentValue: number
  minThreshold?: number
  maxThreshold?: number
  lastCalibration?: string
}

export interface AddPumpInput {
  code: string
  name: string
  subtype: PumpSubtype
  areaId: string
  deviceId: string
  motorIndex: 0 | 1
  ratedPowerKw: number
  ratedFlowM3h: number
  ratedPressureBar: number
  controlEnabled: boolean
}

export interface AddSensorInput {
  code: string
  name: string
  sensorType: SensorType
  metricCode: string
  unit: string
  targetType: 'AREA' | 'PUMP'
  targetId: string
  deviceId: string
  minThreshold?: number
  maxThreshold?: number
}

export interface SimulationStats {
  totalSites: number
  totalAreas: number
  totalDevices: number
  onlineDevices: number
  totalPumps: number
  runningPumps: number
  stoppedPumps: number
  faultPumps: number
  totalSensors: number
  activeAlarms: number
  criticalAlarms: number
  avgPressure: number
  totalFlow: number
  lastUpdated: string
  runningMotors?: number
  totalMotors?: number
}
