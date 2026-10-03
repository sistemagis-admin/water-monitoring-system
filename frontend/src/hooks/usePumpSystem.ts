import { useState, useEffect, useCallback } from 'react'
import type {
  AreaRoom,
  PumpAsset,
  AlarmItem,
  DeviceGateway,
  SensorItem,
  AddPumpInput,
  AddSensorInput,
  SimulationStats,
} from '../types/pump'

const MAX_HISTORY_POINTS = 60

const INITIAL_GATEWAYS: DeviceGateway[] = [
  {
    id: 'gw-001',
    code: 'GW-001',
    name: 'Gateway Utama - Area Intake & Booster',
    siteId: 'SITE-DEMO',
    status: 'ONLINE',
    lastSeen: '2 detik lalu',
    firmware: 'v1.0.4',
    rssi: -61,
    ip: '10.10.20.15',
  },
  {
    id: 'gw-002',
    code: 'GW-002',
    name: 'Gateway Distribusi - Area Heater',
    siteId: 'SITE-DEMO',
    status: 'ONLINE',
    lastSeen: '4 detik lalu',
    firmware: 'v1.0.4',
    rssi: -65,
    ip: '10.10.20.16',
  },
]

const INITIAL_SENSORS: SensorItem[] = [
  {
    id: 'sns-01',
    code: 'PT-01',
    name: 'Discharge Pressure Transmitter',
    sensorType: 'PRESSURE_SENSOR',
    metricCode: 'pressure_bar',
    unit: 'bar',
    targetType: 'AREA',
    targetId: 'room-01',
    targetName: 'Basement (Room 01)',
    deviceId: 'gw-001',
    status: 'ACTIVE',
    currentValue: 3.21,
    minThreshold: 0.5,
    maxThreshold: 6.0,
    lastCalibration: '15 Sep 2026',
  },
  {
    id: 'sns-02',
    code: 'FT-01',
    name: 'Main Intake Flow Meter',
    sensorType: 'FLOW_METER',
    metricCode: 'flow_m3h',
    unit: 'm³/h',
    targetType: 'AREA',
    targetId: 'room-01',
    targetName: 'Basement (Room 01)',
    deviceId: 'gw-001',
    status: 'ACTIVE',
    currentValue: 40.2,
    minThreshold: 0.0,
    maxThreshold: 100.0,
    lastCalibration: '12 Sep 2026',
  },
  {
    id: 'sns-03',
    code: 'LVL-01',
    name: 'Reservoir Intake Ultrasonic Level',
    sensorType: 'LEVEL_SENSOR',
    metricCode: 'tank_level_pct',
    unit: '%',
    targetType: 'AREA',
    targetId: 'room-01',
    targetName: 'Basement (Room 01)',
    deviceId: 'gw-001',
    status: 'ACTIVE',
    currentValue: 74.5,
    minThreshold: 20.0,
    maxThreshold: 95.0,
    lastCalibration: '01 Sep 2026',
  },
  {
    id: 'sns-04',
    code: 'PT-02',
    name: 'Booster Header Pressure Sensor',
    sensorType: 'PRESSURE_SENSOR',
    metricCode: 'pressure_bar',
    unit: 'bar',
    targetType: 'AREA',
    targetId: 'room-02',
    targetName: 'Booster Pump (Room 02)',
    deviceId: 'gw-001',
    status: 'ACTIVE',
    currentValue: 4.62,
    minThreshold: 1.0,
    maxThreshold: 7.5,
    lastCalibration: '18 Sep 2026',
  },
  {
    id: 'sns-05',
    code: 'FT-02',
    name: 'Booster Distribution Flow Meter',
    sensorType: 'FLOW_METER',
    metricCode: 'flow_m3h',
    unit: 'm³/h',
    targetType: 'AREA',
    targetId: 'room-02',
    targetName: 'Booster Pump (Room 02)',
    deviceId: 'gw-001',
    status: 'ACTIVE',
    currentValue: 68.4,
    minThreshold: 0.0,
    maxThreshold: 120.0,
    lastCalibration: '18 Sep 2026',
  },
  {
    id: 'sns-06',
    code: 'LVL-02',
    name: 'Intermediate Tank Level Sensor',
    sensorType: 'LEVEL_SENSOR',
    metricCode: 'tank_level_pct',
    unit: '%',
    targetType: 'AREA',
    targetId: 'room-02',
    targetName: 'Booster Pump (Room 02)',
    deviceId: 'gw-001',
    status: 'ACTIVE',
    currentValue: 82.0,
    minThreshold: 15.0,
    maxThreshold: 98.0,
    lastCalibration: '05 Sep 2026',
  },
  {
    id: 'sns-07',
    code: 'PT-03',
    name: 'Heater Loop Pressure Sensor',
    sensorType: 'PRESSURE_SENSOR',
    metricCode: 'pressure_bar',
    unit: 'bar',
    targetType: 'AREA',
    targetId: 'room-03',
    targetName: 'Heater Pump (Room 03)',
    deviceId: 'gw-002',
    status: 'ACTIVE',
    currentValue: 0.15,
    minThreshold: 0.2,
    maxThreshold: 5.0,
    lastCalibration: '20 Sep 2026',
  },
  {
    id: 'sns-08',
    code: 'TT-01',
    name: 'Heater Water Temperature Sensor',
    sensorType: 'TEMPERATURE_SENSOR',
    metricCode: 'temp_c',
    unit: '°C',
    targetType: 'AREA',
    targetId: 'room-03',
    targetName: 'Heater Pump (Room 03)',
    deviceId: 'gw-002',
    status: 'ACTIVE',
    currentValue: 45.0,
    minThreshold: 10.0,
    maxThreshold: 85.0,
    lastCalibration: '20 Sep 2026',
  },
  {
    id: 'sns-09',
    code: 'VIB-01',
    name: 'Vibration Transmitter Booster P-03',
    sensorType: 'VIBRATION_SENSOR',
    metricCode: 'vibration_mms',
    unit: 'mm/s',
    targetType: 'PUMP',
    targetId: 'pump-03',
    targetName: 'Pump 03 (Booster High)',
    deviceId: 'gw-001',
    status: 'ACTIVE',
    currentValue: 1.25,
    minThreshold: 0.0,
    maxThreshold: 4.5,
    lastCalibration: '22 Sep 2026',
  },
]

const INITIAL_ALARMS: AlarmItem[] = [
  {
    id: 'alm-01',
    code: 'ALM_PUMP_HIGH_P',
    assetId: 'pump-03',
    assetName: 'Pump P-03',
    areaName: 'Booster Station (Room 02)',
    metricCode: 'pressure_bar',
    severity: 'HIGH',
    status: 'OPEN',
    message: 'Tekanan discharge mendekati ambang batas aman (4.65 bar > 4.50 bar)',
    value: 4.65,
    unit: 'bar',
    threshold: 4.50,
    openedAt: '14:38:10',
  },
  {
    id: 'alm-02',
    code: 'ALM_TANK_LOW_LEVEL',
    assetId: 'area-01',
    assetName: 'Reservoir Intake',
    areaName: 'Basement (Room 01)',
    metricCode: 'tank_level_pct',
    severity: 'MEDIUM',
    status: 'OPEN',
    message: 'Level air reservoir intake turun di bawah 30%',
    value: 28.5,
    unit: '%',
    threshold: 30.0,
    openedAt: '14:32:00',
  },
]

const INITIAL_ROOMS: AreaRoom[] = [
  {
    id: 'room-01',
    code: 'BSM',
    name: 'Basement',
    number: '01',
    sensorTag: 'PT-01 / FT-01 / LVL-01',
    basePressure: 3.2,
    baseFlow: 40.2,
    color: 'var(--c1)',
    tankLevel: 74.5,
    motors: [1, 0],
    pressure: 3.21,
    flowRate: 40.2,
    history: {
      pressure: Array.from({ length: MAX_HISTORY_POINTS }, () => 3.21),
      flowRate: Array.from({ length: MAX_HISTORY_POINTS }, () => 40.2),
      power: Array.from({ length: MAX_HISTORY_POINTS }, () => 18.5),
    },
    pumps: [
      {
        id: 'pump-01',
        code: 'P-01',
        name: 'Pump 01 (Intake Main)',
        areaId: 'room-01',
        areaName: 'Basement',
        motorIndex: 0,
        status: 'RUNNING',
        controlEnabled: true,
        remoteAllowed: true,
        commandState: 'IDLE',
        metrics: {
          pressure_bar: 3.21,
          flow_m3h: 40.2,
          tank_level_pct: 74.5,
          power_kw: 18.5,
          current_a: 32.1,
          voltage_v: 382.4,
          frequency_hz: 50.0,
          motor_temp_c: 44.5,
          energy_kwh: 1248.5,
        },
      },
      {
        id: 'pump-02',
        code: 'P-02',
        name: 'Pump 02 (Intake Aux)',
        areaId: 'room-01',
        areaName: 'Basement',
        motorIndex: 1,
        status: 'STOPPED',
        controlEnabled: true,
        remoteAllowed: true,
        commandState: 'IDLE',
        metrics: {
          pressure_bar: 0.15,
          flow_m3h: 0.0,
          tank_level_pct: 74.5,
          power_kw: 0.0,
          current_a: 0.0,
          voltage_v: 382.0,
          frequency_hz: 0.0,
          motor_temp_c: 28.2,
          energy_kwh: 842.1,
        },
      },
    ],
  },
  {
    id: 'room-02',
    code: 'BSP',
    name: 'Booster Pump',
    number: '02',
    sensorTag: 'PT-02 / FT-02 / LVL-02',
    basePressure: 4.6,
    baseFlow: 68.4,
    color: 'var(--c2)',
    tankLevel: 82.0,
    motors: [1, 0],
    pressure: 4.62,
    flowRate: 68.4,
    history: {
      pressure: Array.from({ length: MAX_HISTORY_POINTS }, () => 4.62),
      flowRate: Array.from({ length: MAX_HISTORY_POINTS }, () => 68.4),
      power: Array.from({ length: MAX_HISTORY_POINTS }, () => 24.2),
    },
    pumps: [
      {
        id: 'pump-03',
        code: 'P-03',
        name: 'Pump 03 (Booster High)',
        areaId: 'room-02',
        areaName: 'Booster Station',
        motorIndex: 0,
        status: 'RUNNING',
        controlEnabled: true,
        remoteAllowed: true,
        commandState: 'IDLE',
        metrics: {
          pressure_bar: 4.62,
          flow_m3h: 68.4,
          tank_level_pct: 82.0,
          power_kw: 24.2,
          current_a: 42.5,
          voltage_v: 381.8,
          frequency_hz: 50.0,
          motor_temp_c: 48.0,
          energy_kwh: 2150.3,
        },
      },
      {
        id: 'pump-04',
        code: 'P-04',
        name: 'Pump 04 (Booster Standby)',
        areaId: 'room-02',
        areaName: 'Booster Station',
        motorIndex: 1,
        status: 'STOPPED',
        controlEnabled: true,
        remoteAllowed: true,
        commandState: 'IDLE',
        metrics: {
          pressure_bar: 0.15,
          flow_m3h: 0.0,
          tank_level_pct: 82.0,
          power_kw: 0.0,
          current_a: 0.0,
          voltage_v: 381.5,
          frequency_hz: 0.0,
          motor_temp_c: 29.1,
          energy_kwh: 1104.8,
        },
      },
    ],
  },
  {
    id: 'room-03',
    code: 'HTP',
    name: 'Heater Pump',
    number: '03',
    sensorTag: 'PT-03 / FT-03 / LVL-03',
    basePressure: 2.95,
    baseFlow: 55.0,
    color: 'var(--c3)',
    tankLevel: 65.0,
    motors: [0, 0],
    pressure: 0.15,
    flowRate: 0.0,
    history: {
      pressure: Array.from({ length: MAX_HISTORY_POINTS }, () => 0.15),
      flowRate: Array.from({ length: MAX_HISTORY_POINTS }, () => 0.0),
      power: Array.from({ length: MAX_HISTORY_POINTS }, () => 0.0),
    },
    pumps: [
      {
        id: 'pump-05',
        code: 'P-05',
        name: 'Pump 05 (Heater Transfer)',
        areaId: 'room-03',
        areaName: 'Heater Room',
        motorIndex: 0,
        status: 'STOPPED',
        controlEnabled: true,
        remoteAllowed: true,
        commandState: 'IDLE',
        metrics: {
          pressure_bar: 0.15,
          flow_m3h: 0.0,
          tank_level_pct: 65.0,
          power_kw: 0.0,
          current_a: 0.0,
          voltage_v: 380.5,
          frequency_hz: 0.0,
          motor_temp_c: 26.5,
          energy_kwh: 520.4,
        },
      },
      {
        id: 'pump-06',
        code: 'P-06',
        name: 'Pump 06 (Heater Circulate)',
        areaId: 'room-03',
        areaName: 'Heater Room',
        motorIndex: 1,
        status: 'STOPPED',
        controlEnabled: true,
        remoteAllowed: true,
        commandState: 'IDLE',
        metrics: {
          pressure_bar: 0.15,
          flow_m3h: 0.0,
          tank_level_pct: 65.0,
          power_kw: 0.0,
          current_a: 0.0,
          voltage_v: 380.5,
          frequency_hz: 0.0,
          motor_temp_c: 27.0,
          energy_kwh: 412.0,
        },
      },
    ],
  },
]

export function usePumpSystem() {
  const [rooms, setRooms] = useState<AreaRoom[]>(INITIAL_ROOMS)
  const [gateways, setGateways] = useState<DeviceGateway[]>(INITIAL_GATEWAYS)
  const [sensors, setSensors] = useState<SensorItem[]>(INITIAL_SENSORS)
  const [alarms, setAlarms] = useState<AlarmItem[]>(INITIAL_ALARMS)
  const [isSimulating, setIsSimulating] = useState<boolean>(true)
  const [lastTime, setLastTime] = useState<string>(() =>
    new Date().toLocaleTimeString('id-ID').replace(/\./g, ':')
  )

  // Add new pump dynamically (PRD FR-005 & FR-006)
  const addPump = useCallback((input: AddPumpInput) => {
    setRooms((prevRooms) => {
      const roomIndex = prevRooms.findIndex((r) => r.id === input.areaId)
      if (roomIndex === -1) return prevRooms

      const targetRoom = prevRooms[roomIndex]
      const newPumpId = `pump-${Date.now()}`

      const newPumpAsset: PumpAsset = {
        id: newPumpId,
        code: input.code,
        name: input.name,
        areaId: targetRoom.id,
        areaName: targetRoom.name,
        motorIndex: input.motorIndex,
        status: 'STOPPED',
        controlEnabled: input.controlEnabled,
        remoteAllowed: input.controlEnabled,
        commandState: 'IDLE',
        metrics: {
          pressure_bar: 0.15,
          flow_m3h: 0.0,
          tank_level_pct: targetRoom.tankLevel || 75,
          power_kw: 0.0,
          current_a: 0.0,
          voltage_v: 380.0,
          frequency_hz: 0.0,
          motor_temp_c: 25.0,
          energy_kwh: 120.0,
        },
      }

      const updatedPumps = [...targetRoom.pumps] as [PumpAsset, PumpAsset]
      if (input.motorIndex === 0) {
        updatedPumps[0] = newPumpAsset
      } else {
        updatedPumps[1] = newPumpAsset
      }

      const updatedRoom: AreaRoom = {
        ...targetRoom,
        pumps: updatedPumps,
      }

      const newRooms = [...prevRooms]
      newRooms[roomIndex] = updatedRoom
      return newRooms
    })
  }, [])

  // Add new sensor dynamically with binding (PRD FR-006 & Section 24.10 / 24.11)
  const addSensor = useCallback(
    (input: AddSensorInput) => {
      const targetRoom = rooms.find((r) => r.id === input.targetId)
      const targetPump = rooms.flatMap((r) => r.pumps).find((p) => p.id === input.targetId)

      let targetName = 'System'
      if (input.targetType === 'AREA') {
        targetName = targetRoom ? `${targetRoom.name} (${targetRoom.number})` : 'Area'
      } else {
        targetName = targetPump ? targetPump.name : 'Pump'
      }

      const initialVal = input.metricCode.includes('pressure')
        ? +(2.5 + Math.random() * 2).toFixed(2)
        : input.metricCode.includes('flow')
        ? +(40 + Math.random() * 30).toFixed(1)
        : input.metricCode.includes('temp')
        ? +(35 + Math.random() * 15).toFixed(1)
        : input.metricCode.includes('level')
        ? +(60 + Math.random() * 30).toFixed(1)
        : +(1.0 + Math.random() * 2).toFixed(2)

      const newSensor: SensorItem = {
        id: `sns-${Date.now()}`,
        code: input.code,
        name: input.name,
        sensorType: input.sensorType,
        metricCode: input.metricCode,
        unit: input.unit,
        targetType: input.targetType,
        targetId: input.targetId,
        targetName,
        deviceId: input.deviceId,
        status: 'ACTIVE',
        currentValue: initialVal,
        minThreshold: input.minThreshold,
        maxThreshold: input.maxThreshold,
        lastCalibration: new Date().toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      }

      setSensors((prev) => [newSensor, ...prev])
    },
    [rooms]
  )

  // Delete sensor
  const deleteSensor = useCallback((sensorId: string) => {
    setSensors((prev) => prev.filter((s) => s.id !== sensorId))
  }, [])

  // Toggle pump motor state with commanded verification
  const togglePumpPower = useCallback((roomIndex: number, motorIndex: 0 | 1) => {
    setRooms((prev) =>
      prev.map((room, rIdx) => {
        if (rIdx !== roomIndex) return room

        const updatedPumps = [...room.pumps] as [PumpAsset, PumpAsset]
        const targetPump = updatedPumps[motorIndex]
        const willBeRunning = targetPump.status !== 'RUNNING'

        updatedPumps[motorIndex] = {
          ...targetPump,
          status: willBeRunning ? 'RUNNING' : 'STOPPED',
          commandState: 'EXECUTED',
          metrics: {
            ...targetPump.metrics,
            power_kw: willBeRunning ? 18.0 + Math.random() * 6 : 0,
            current_a: willBeRunning ? 30.0 + Math.random() * 12 : 0,
            frequency_hz: willBeRunning ? 50.0 : 0,
          },
        }

        return {
          ...room,
          pumps: updatedPumps,
        }
      })
    )
  }, [])

  // Emergency stop all pumps across all rooms
  const emergencyStop = useCallback(() => {
    setRooms((prev) =>
      prev.map((room) => ({
        ...room,
        pumps: [
          {
            ...room.pumps[0],
            status: 'STOPPED',
            commandState: 'EXECUTED',
            metrics: { ...room.pumps[0].metrics, power_kw: 0, current_a: 0, frequency_hz: 0 },
          },
          {
            ...room.pumps[1],
            status: 'STOPPED',
            commandState: 'EXECUTED',
            metrics: { ...room.pumps[1].metrics, power_kw: 0, current_a: 0, frequency_hz: 0 },
          },
        ],
      }))
    )
  }, [])

  // Acknowledge alarm
  const acknowledgeAlarm = useCallback((alarmId: string) => {
    setAlarms((prev) =>
      prev.map((alm) => {
        if (alm.id !== alarmId) return alm
        return {
          ...alm,
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date().toLocaleTimeString('id-ID').replace(/\./g, ':'),
          acknowledgedBy: 'Operator SCADA',
        }
      })
    )
  }, [])

  // Step physics simulation tick every 1000ms
  useEffect(() => {
    if (!isSimulating) return

    const interval = setInterval(() => {
      const nowStr = new Date().toLocaleTimeString('id-ID').replace(/\./g, ':')
      setLastTime(nowStr)

      // Step rooms & pumps physics
      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          const m1Running = room.pumps[0].status === 'RUNNING' ? 1 : 0
          const m2Running = room.pumps[1].status === 'RUNNING' ? 1 : 0
          const activeMotorCount = m1Running + m2Running

          const targetP =
            activeMotorCount > 0
              ? room.basePressure + (activeMotorCount > 1 ? 0.65 : 0)
              : 0.15
          const targetF =
            activeMotorCount > 0
              ? room.baseFlow * (activeMotorCount > 1 ? 1.7 : 1)
              : 0

          const jitter = activeMotorCount > 0 ? 1 : 0
          const noiseP = (Math.random() - 0.5) * 0.08 * jitter
          const noiseF = (Math.random() - 0.5) * 1.5 * jitter

          let nextP = room.pressure + (targetP - room.pressure) * 0.35 + noiseP
          let nextF =
            activeMotorCount > 0
              ? room.flowRate + (targetF - room.flowRate) * 0.35 + noiseF
              : Math.max(0, room.flowRate * 0.5 - 0.2)

          if (nextF < 0.05) nextF = 0
          if (nextP < 0) nextP = 0

          const newPressHist = [...room.history.pressure.slice(1), nextP]
          const newFlowHist = [...room.history.flowRate.slice(1), nextF]

          // Update active power
          const totalPower =
            (m1Running ? room.pumps[0].metrics.power_kw : 0) +
            (m2Running ? room.pumps[1].metrics.power_kw : 0)
          const newPowerHist = [...room.history.power.slice(1), totalPower]

          const updatedPumps: [PumpAsset, PumpAsset] = [
            {
              ...room.pumps[0],
              metrics: {
                ...room.pumps[0].metrics,
                pressure_bar: m1Running ? nextP : 0.15,
                flow_m3h: m1Running ? nextF * (activeMotorCount > 1 ? 0.55 : 1) : 0,
              },
            },
            {
              ...room.pumps[1],
              metrics: {
                ...room.pumps[1].metrics,
                pressure_bar: m2Running ? nextP : 0.15,
                flow_m3h: m2Running ? nextF * (activeMotorCount > 1 ? 0.45 : 1) : 0,
              },
            },
          ]

          return {
            ...room,
            motors: [m1Running as 0 | 1, m2Running as 0 | 1],
            pressure: nextP,
            flowRate: nextF,
            pumps: updatedPumps,
            history: {
              pressure: newPressHist,
              flowRate: newFlowHist,
              power: newPowerHist,
            },
          }
        })
      )

      // Sync sensor live readings with active system
      setSensors((prevSensors) =>
        prevSensors.map((sensor) => {
          let updatedVal = sensor.currentValue
          if (sensor.metricCode === 'pressure_bar') {
            const matchedRoom = rooms.find((r) => r.id === sensor.targetId)
            if (matchedRoom) {
              updatedVal = +matchedRoom.pressure.toFixed(2)
            }
          } else if (sensor.metricCode === 'flow_m3h') {
            const matchedRoom = rooms.find((r) => r.id === sensor.targetId)
            if (matchedRoom) {
              updatedVal = +matchedRoom.flowRate.toFixed(1)
            }
          } else if (sensor.metricCode === 'tank_level_pct') {
            updatedVal = +(sensor.currentValue + (Math.random() - 0.5) * 0.1).toFixed(1)
          } else if (sensor.metricCode === 'temp_c') {
            updatedVal = +(sensor.currentValue + (Math.random() - 0.5) * 0.2).toFixed(1)
          }
          return {
            ...sensor,
            currentValue: updatedVal,
          }
        })
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [isSimulating, rooms])

  // Aggregate System KPI Stats based on PRD Section 21.2 & 29
  let totalPumps = 0
  let runningPumps = 0
  let stoppedPumps = 0
  let faultPumps = 0
  let totalFlow = 0
  let totalPressure = 0

  rooms.forEach((r) => {
    r.pumps.forEach((p) => {
      totalPumps++
      if (p.status === 'RUNNING') runningPumps++
      else if (p.status === 'STOPPED') stoppedPumps++
      else if (p.status === 'FAULT') faultPumps++
    })
    totalFlow += r.flowRate
    totalPressure += r.pressure
  })

  const avgPressure = +(totalPressure / (rooms.length || 1)).toFixed(2)
  const activeAlarmsCount = alarms.filter((a) => a.status === 'OPEN').length
  const criticalAlarmsCount = alarms.filter((a) => a.status === 'OPEN' && a.severity === 'CRITICAL').length

  const stats: SimulationStats = {
    totalSites: 1,
    totalAreas: rooms.length,
    totalDevices: gateways.length,
    onlineDevices: gateways.filter((g) => g.status === 'ONLINE').length,
    totalPumps,
    runningPumps,
    stoppedPumps,
    faultPumps,
    totalSensors: sensors.length,
    activeAlarms: activeAlarmsCount,
    criticalAlarms: criticalAlarmsCount,
    avgPressure,
    totalFlow: +totalFlow.toFixed(1),
    lastUpdated: lastTime,
    runningMotors: runningPumps,
    totalMotors: totalPumps,
  }

  return {
    rooms,
    setRooms,
    stations: rooms,
    gateways,
    setGateways,
    sensors,
    setSensors,
    alarms,
    setAlarms,
    stats,
    isSimulating,
    setIsSimulating,
    addPump,
    addSensor,
    deleteSensor,
    togglePumpPower,
    toggleMotor: togglePumpPower,
    emergencyStop,
    acknowledgeAlarm,
  }
}
