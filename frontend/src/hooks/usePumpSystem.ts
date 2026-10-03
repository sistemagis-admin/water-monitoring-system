import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  AreaRoom,
  PumpAsset,
  AlarmItem,
  DeviceGateway,
  SensorItem,
  AddPumpInput,
  AddSensorInput,
  SimulationStats,
  PumpStatus,
} from '../types/pump'
import {
  api,
  subscribeRealtimeSSE,
  getStoredToken,
  removeStoredToken,
  type ApiUser,
} from '../services/api'

const MAX_HISTORY_POINTS = 60

export function usePumpSystem() {
  const [rooms, setRooms] = useState<AreaRoom[]>([])
  const [gateways, setGateways] = useState<DeviceGateway[]>([])
  const [sensors, setSensors] = useState<SensorItem[]>([])
  const [alarms, setAlarms] = useState<AlarmItem[]>([])
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null)
  const [siteInfo, setSiteInfo] = useState<{ id: string; code: string; name: string } | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getStoredToken())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Connectivity states
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false)
  const [isLiveSSE, setIsLiveSSE] = useState<boolean>(false)
  const [lastTime, setLastTime] = useState<string>(() =>
    new Date().toLocaleTimeString('id-ID').replace(/\./g, ':')
  )

  const sseUnsubscribeRef = useRef<(() => void) | null>(null)

  // 1. Fetch live data from Backend API
  const fetchBackendData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Check health probe
      const readyRes = await api.health.getReady().catch(() => null)
      if (!readyRes || !readyRes.success || !readyRes.data?.ready) {
        setIsBackendOnline(false)
        setIsLiveSSE(false)
        setIsLoading(false)
        return false
      }

      setIsBackendOnline(true)

      // Fetch current profile
      const meRes = await api.auth.me().catch(() => null)
      if (meRes?.success && meRes.data) {
        setCurrentUser(meRes.data)
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        setIsLoading(false)
        return false
      }

      // Fetch dynamic topology from Backend (Site -> Areas -> Pumps -> Sensors)
      const topoRes = await api.sensors.getTopology().catch(() => null)
      if (topoRes?.success && topoRes.data) {
        setSiteInfo(topoRes.data.site)

        if (topoRes.data.areas && topoRes.data.areas.length > 0) {
          const colorList = ['var(--c1)', 'var(--c2)', 'var(--c3)', '#10B981', '#F59E0B', '#8B5CF6']

          const parsedRooms: AreaRoom[] = topoRes.data.areas.map((a, idx) => {
            const areaSensors = a.area_sensors || []
            const tagStr = areaSensors.map((s) => s.code).join(' / ') || `AREA-${a.code}`

            const parsedPumps: PumpAsset[] = a.assets.map((ast, pIdx) => {
              const metrics = ast.sensors.reduce((acc: any, s) => {
                acc[s.metric_code] = s.value !== null ? Number(s.value) : 0
                return acc
              }, {})

              const isRunning = ast.status === 'RUNNING'

              return {
                id: ast.id,
                code: ast.code,
                name: ast.name,
                areaId: a.id,
                areaName: a.name,
                motorIndex: (pIdx % 2) as 0 | 1,
                status: (ast.status as PumpStatus) || 'STOPPED',
                controlEnabled: ast.capabilities?.control_enabled ?? true,
                remoteAllowed: ast.capabilities?.remote_control_allowed ?? true,
                commandState: 'IDLE',
                metrics: {
                  pressure_bar: metrics.pressure_bar || (isRunning ? 3.5 : 0.15),
                  flow_m3h: metrics.flow_m3h || (isRunning ? 45.0 : 0),
                  tank_level_pct: metrics.tank_level_pct || 75.0,
                  power_kw: metrics.power_kw || (isRunning ? 18.5 : 0),
                  current_a: metrics.current_a || (isRunning ? 32.0 : 0),
                  voltage_v: metrics.voltage_v || 382.0,
                  frequency_hz: metrics.frequency_hz || (isRunning ? 50.0 : 0),
                  motor_temp_c: metrics.motor_temp_c || (isRunning ? 45.0 : 26.0),
                  energy_kwh: metrics.energy_kwh || 1000.0,
                },
              }
            })

            // Ensure 2 pump slots per room for symmetrical SCADA control panel
            while (parsedPumps.length < 2) {
              const pSlot = parsedPumps.length + 1
              parsedPumps.push({
                id: `pump-${a.code}-${pSlot}`,
                code: `P-${a.code}-${pSlot}`,
                name: `Pump Aux ${pSlot}`,
                areaId: a.id,
                areaName: a.name,
                motorIndex: (parsedPumps.length as 0 | 1),
                status: 'STOPPED',
                controlEnabled: true,
                remoteAllowed: true,
                commandState: 'IDLE',
                metrics: {
                  pressure_bar: 0.15,
                  flow_m3h: 0,
                  tank_level_pct: 75.0,
                  power_kw: 0,
                  current_a: 0,
                  voltage_v: 380.0,
                  frequency_hz: 0,
                  motor_temp_c: 25.0,
                  energy_kwh: 500.0,
                },
              })
            }

            const p1 = parsedPumps[0]
            const p2 = parsedPumps[1]
            const m1Run = p1.status === 'RUNNING' ? 1 : 0
            const m2Run = p2.status === 'RUNNING' ? 1 : 0

            const avgP = Math.max(p1.metrics.pressure_bar, p2.metrics.pressure_bar)
            const sumF = p1.metrics.flow_m3h + p2.metrics.flow_m3h

            return {
              id: a.id,
              code: a.code,
              name: a.name,
              number: `0${idx + 1}`,
              sensorTag: tagStr,
              basePressure: avgP > 1 ? avgP : 3.5,
              baseFlow: sumF > 5 ? sumF : 50.0,
              color: colorList[idx % colorList.length],
              tankLevel: 75.0,
              motors: [m1Run as 0 | 1, m2Run as 0 | 1],
              pressure: avgP,
              flowRate: sumF,
              pumps: [p1, p2],
              history: {
                pressure: Array.from({ length: MAX_HISTORY_POINTS }, () => avgP),
                flowRate: Array.from({ length: MAX_HISTORY_POINTS }, () => sumF),
                power: Array.from({ length: MAX_HISTORY_POINTS }, () => p1.metrics.power_kw + p2.metrics.power_kw),
              },
            }
          })

          setRooms(parsedRooms)
        }
      }

      // Fetch Gateways / Devices
      const devRes = await api.devices.list().catch(() => null)
      if (devRes?.success && Array.isArray(devRes.data)) {
        const parsedDevs: DeviceGateway[] = devRes.data.map((d: any) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          siteId: d.site_name || d.site_id || 'SITE-DEMO',
          status: d.status || 'ONLINE',
          lastSeen: d.last_seen_at ? new Date(d.last_seen_at).toLocaleTimeString('id-ID') : 'Baru saja',
          firmware: d.firmware_version || 'v1.0.4',
          rssi: d.rssi || -60,
          ip: d.ip_address || '192.168.1.100',
        }))
        setGateways(parsedDevs)
      }

      // Fetch Sensors list with dynamic bindings
      const snsRes = await api.sensors.list().catch(() => null)
      if (snsRes?.success && Array.isArray(snsRes.data)) {
        const parsedSensors: SensorItem[] = snsRes.data.map((s: any) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          sensorType: s.sensor_type,
          metricCode: s.metric_code,
          unit: s.unit || '',
          targetType: s.bound_asset_name ? 'PUMP' : 'AREA',
          targetId: s.asset_id || s.area_id || '',
          targetName: s.bound_asset_name || s.bound_area_name || 'Plant Area',
          deviceId: s.device_code || s.device_id || 'gw-001',
          status: s.status || 'ACTIVE',
          currentValue: 0,
          minThreshold: s.config?.min_threshold,
          maxThreshold: s.config?.max_threshold,
          lastCalibration: s.updated_at
            ? new Date(s.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'Aktif',
        }))
        setSensors(parsedSensors)
      }

      // Fetch Alarms
      const almRes = await api.alarms.list().catch(() => null)
      if (almRes?.success && Array.isArray(almRes.data)) {
        const parsedAlarms: AlarmItem[] = almRes.data.map((a: any) => ({
          id: a.id,
          code: a.rule_code || 'ALM_CRITICAL',
          assetId: a.asset_id || '',
          assetName: a.asset_name || 'System Asset',
          areaName: a.site_name || 'WTP Plant',
          metricCode: a.metric_code || 'pressure_bar',
          severity: a.severity || 'HIGH',
          status: a.status || 'OPEN',
          message: a.message || 'Kondisi alarm abnormal terdeteksi',
          value: a.metric_value ? Number(a.metric_value) : 0,
          unit: a.unit || '',
          threshold: a.threshold ? Number(a.threshold) : 0,
          openedAt: a.opened_at ? new Date(a.opened_at).toLocaleTimeString('id-ID') : 'Hari ini',
          acknowledgedAt: a.acknowledged_at,
          acknowledgedBy: a.acknowledged_by_name,
        }))
        setAlarms(parsedAlarms)
      }

      // Connect to Realtime Server-Sent Events (SSE) stream
      if (sseUnsubscribeRef.current) {
        sseUnsubscribeRef.current()
      }

      sseUnsubscribeRef.current = subscribeRealtimeSSE({
        onOpen: () => {
          setIsLiveSSE(true)
        },
        onMessage: ({ event, data }) => {
          if (event === 'telemetry.update' && data?.asset_id) {
            setRooms((prevRooms) =>
              prevRooms.map((room) => {
                const updatedPumps = room.pumps.map((pump) => {
                  if (pump.id === data.asset_id || pump.code === data.asset_code) {
                    const nextMetrics = { ...pump.metrics, ...(data.metrics || {}) }
                    return {
                      ...pump,
                      metrics: nextMetrics,
                      status: data.metrics?.pump_running ? 'RUNNING' : pump.status,
                    }
                  }
                  return pump
                }) as [PumpAsset, PumpAsset]

                return {
                  ...room,
                  pumps: updatedPumps,
                }
              })
            )
          } else if (event === 'asset.state' || event === 'asset.status') {
            const assetId = data?.asset_id || data?.id
            const nextStatus = data?.status
            if (assetId && nextStatus) {
              setRooms((prevRooms) =>
                prevRooms.map((room) => {
                  const updatedPumps = room.pumps.map((pump) => {
                    if (pump.id === assetId || pump.code === data.code) {
                      return {
                        ...pump,
                        status: nextStatus as PumpStatus,
                      }
                    }
                    return pump
                  }) as [PumpAsset, PumpAsset]

                  return {
                    ...room,
                    pumps: updatedPumps,
                  }
                })
              )
            }
          } else if (event === 'alarm.created') {
            const newAlm: AlarmItem = {
              id: data.id,
              code: data.rule_code || 'ALM_NEW',
              assetId: data.asset_id || '',
              assetName: data.asset_name || 'Pump Asset',
              areaName: 'Plant Area',
              metricCode: data.metric_code || '',
              severity: data.severity || 'HIGH',
              status: 'OPEN',
              message: data.message || 'Alarm baru terdeteksi',
              value: data.metric_value ? Number(data.metric_value) : 0,
              unit: data.unit || '',
              threshold: data.threshold ? Number(data.threshold) : 0,
              openedAt: new Date().toLocaleTimeString('id-ID'),
            }
            setAlarms((prev) => [newAlm, ...prev.filter((a) => a.id !== data.id)])
          } else if (event === 'alarm.updated') {
            setAlarms((prev) =>
              prev.map((a) => (a.id === data.id ? { ...a, status: data.status, acknowledgedAt: data.acknowledged_at } : a))
            )
          } else if (event === 'device.status') {
            setGateways((prev) =>
              prev.map((g) => (g.id === data.id || g.code === data.code ? { ...g, status: data.status } : g))
            )
          }
        },
        onError: () => {
          setIsLiveSSE(false)
        },
      })

      return true
    } catch {
      setIsBackendOnline(false)
      setIsLiveSSE(false)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Login handler
  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const res = await api.auth.login(credentials)
      if (res.success && res.data?.user) {
        setCurrentUser(res.data.user)
        setIsAuthenticated(true)
        await fetchBackendData()
        return { success: true }
      }
      return {
        success: false,
        error: res.error?.message || 'Login gagal. Periksa kembali email dan password.',
      }
    },
    [fetchBackendData]
  )

  // Logout handler
  const logout = useCallback(async () => {
    await api.auth.logout().catch(() => null)
    removeStoredToken()
    setCurrentUser(null)
    setIsAuthenticated(false)
    setRooms([])
    setGateways([])
    setSensors([])
    setAlarms([])
    if (sseUnsubscribeRef.current) {
      sseUnsubscribeRef.current()
      sseUnsubscribeRef.current = null
    }
  }, [])

  // Mount effect
  useEffect(() => {
    const token = getStoredToken()
    if (token) {
      fetchBackendData()
    } else {
      setIsLoading(false)
    }

    const interval = setInterval(() => {
      if (getStoredToken()) {
        fetchBackendData()
      }
    }, 20000)

    return () => {
      clearInterval(interval)
      if (sseUnsubscribeRef.current) {
        sseUnsubscribeRef.current()
      }
    }
  }, [fetchBackendData])

  // Real-time clock update & dynamic physics step
  useEffect(() => {
    const interval = setInterval(() => {
      const nowStr = new Date().toLocaleTimeString('id-ID').replace(/\./g, ':')
      setLastTime(nowStr)

      // Step rooms & pumps physics if active
      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          const m1Running = room.pumps[0]?.status === 'RUNNING' ? 1 : 0
          const m2Running = room.pumps[1]?.status === 'RUNNING' ? 1 : 0
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

          const totalPower =
            (m1Running ? (room.pumps[0]?.metrics.power_kw || 18.5) : 0) +
            (m2Running ? (room.pumps[1]?.metrics.power_kw || 18.5) : 0)
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

      // Sync sensor live readings
      setSensors((prevSensors) =>
        prevSensors.map((sensor) => {
          let updatedVal = sensor.currentValue
          if (sensor.metricCode === 'pressure_bar') {
            const matchedRoom = rooms.find((r) => r.id === sensor.targetId)
            if (matchedRoom) updatedVal = +matchedRoom.pressure.toFixed(2)
          } else if (sensor.metricCode === 'flow_m3h') {
            const matchedRoom = rooms.find((r) => r.id === sensor.targetId)
            if (matchedRoom) updatedVal = +matchedRoom.flowRate.toFixed(1)
          } else if (sensor.metricCode === 'tank_level_pct') {
            updatedVal = +(sensor.currentValue + (Math.random() - 0.5) * 0.1).toFixed(1)
          }
          return {
            ...sensor,
            currentValue: updatedVal,
          }
        })
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [rooms])

  // Toggle pump motor power (Issues remote command to Fastify backend)
  const togglePumpPower = useCallback(
    async (roomIndex: number, motorIndex: 0 | 1) => {
      const targetRoom = rooms[roomIndex]
      if (!targetRoom) return
      const targetPump = targetRoom.pumps[motorIndex]
      if (!targetPump) return

      const willBeRunning = targetPump.status !== 'RUNNING'
      const desiredState = willBeRunning ? 'ON' : 'OFF'

      // 1. Optimistic UI update
      setRooms((prev) =>
        prev.map((room, rIdx) => {
          if (rIdx !== roomIndex) return room

          const updatedPumps = [...room.pumps] as [PumpAsset, PumpAsset]
          updatedPumps[motorIndex] = {
            ...targetPump,
            status: willBeRunning ? 'RUNNING' : 'STOPPED',
            commandState: 'SENT',
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

      // 2. Send API Command to Backend
      if (isBackendOnline && targetPump.id) {
        try {
          await api.assets.issuePowerCommand(targetPump.id, {
            desired_state: desiredState,
            confirmation: true,
            note: `Operator UI command ${desiredState}`,
          })
        } catch (err) {
          console.warn('API command error:', err)
        }
      }
    },
    [rooms, isBackendOnline]
  )

  // Emergency stop all pumps across all rooms
  const emergencyStop = useCallback(async () => {
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

    if (isBackendOnline) {
      const runningPumps = rooms.flatMap((r) => r.pumps).filter((p) => p.status === 'RUNNING')
      for (const p of runningPumps) {
        api.assets.issuePowerCommand(p.id, {
          desired_state: 'OFF',
          confirmation: true,
          note: 'EMERGENCY STOP FROM WEB SCADA',
        }).catch(console.warn)
      }
    }
  }, [rooms, isBackendOnline])

  // Add new pump dynamically (PRD FR-005 & FR-006)
  const addPump = useCallback(
    async (input: AddPumpInput) => {
      let resolvedAssetId = `pump-${Date.now()}`

      if (isBackendOnline) {
        try {
          const res = await api.assets.create({
            site_id: siteInfo?.id || '00000000-0000-0000-0000-000000000001',
            area_id: input.areaId,
            device_id: input.deviceId,
            code: input.code,
            name: input.name,
            asset_type: 'PUMP',
            asset_subtype: input.subtype,
            metadata: {
              rated_power_kw: input.ratedPowerKw,
              rated_flow_m3h: input.ratedFlowM3h,
              rated_pressure_bar: input.ratedPressureBar,
              control_enabled: input.controlEnabled,
            },
          })
          if (res?.success && res.data?.id) {
            resolvedAssetId = res.data.id
          }
        } catch (err) {
          console.warn('Backend asset create error:', err)
        }
      }

      setRooms((prevRooms) => {
        const roomIndex = prevRooms.findIndex((r) => r.id === input.areaId)
        if (roomIndex === -1) return prevRooms

        const targetRoom = prevRooms[roomIndex]
        const newPumpAsset: PumpAsset = {
          id: resolvedAssetId,
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
    },
    [isBackendOnline, siteInfo]
  )

  // Add new sensor dynamically with binding (PRD FR-006 & Section 24.10 / 24.11)
  const addSensor = useCallback(
    async (input: AddSensorInput) => {
      const targetRoom = rooms.find((r) => r.id === input.targetId)
      const targetPump = rooms.flatMap((r) => r.pumps).find((p) => p.id === input.targetId)

      let targetName = 'System'
      if (input.targetType === 'AREA') {
        targetName = targetRoom ? `${targetRoom.name} (${targetRoom.number})` : 'Area'
      } else {
        targetName = targetPump ? targetPump.name : 'Pump'
      }

      let resolvedSensorId = `sns-${Date.now()}`

      if (isBackendOnline) {
        try {
          const createRes = await api.sensors.create({
            site_id: siteInfo?.id || '00000000-0000-0000-0000-000000000001',
            device_id: input.deviceId,
            code: input.code,
            name: input.name,
            sensor_type: input.sensorType,
            metric_code: input.metricCode,
            unit: input.unit,
            config: {
              min_threshold: input.minThreshold,
              max_threshold: input.maxThreshold,
            },
          })

          if (createRes?.success && createRes.data?.id) {
            resolvedSensorId = createRes.data.id
            await api.sensors.bind(resolvedSensorId, {
              area_id: input.targetType === 'AREA' ? input.targetId : undefined,
              asset_id: input.targetType === 'PUMP' ? input.targetId : undefined,
              role: input.sensorType,
            })
          }
        } catch (err) {
          console.warn('Backend sensor create error:', err)
        }
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
        id: resolvedSensorId,
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
    [rooms, isBackendOnline, siteInfo]
  )

  // Delete sensor
  const deleteSensor = useCallback(
    async (sensorId: string) => {
      setSensors((prev) => prev.filter((s) => s.id !== sensorId))
      if (isBackendOnline) {
        api.sensors.delete(sensorId).catch(console.warn)
      }
    },
    [isBackendOnline]
  )

  // Acknowledge alarm
  const acknowledgeAlarm = useCallback(
    async (alarmId: string) => {
      setAlarms((prev) =>
        prev.map((alm) => {
          if (alm.id !== alarmId) return alm
          return {
            ...alm,
            status: 'ACKNOWLEDGED',
            acknowledgedAt: new Date().toLocaleTimeString('id-ID').replace(/\./g, ':'),
            acknowledgedBy: currentUser?.full_name || 'Operator SCADA',
          }
        })
      )

      if (isBackendOnline) {
        api.alarms.acknowledge(alarmId, 'Acknowledged via web UI').catch(console.warn)
      }
    },
    [isBackendOnline, currentUser]
  )

  // Aggregate KPI Stats
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
    totalSites: siteInfo ? 1 : 0,
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
    isLoading,
    isAuthenticated,
    isBackendOnline,
    isLiveSSE,
    currentUser,
    siteInfo,
    login,
    logout,
    reconnectBackend: fetchBackendData,
    addPump,
    addSensor,
    deleteSensor,
    togglePumpPower,
    toggleMotor: togglePumpPower,
    emergencyStop,
    acknowledgeAlarm,
  }
}
