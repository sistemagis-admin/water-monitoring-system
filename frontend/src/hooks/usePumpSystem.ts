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
  PumpSubtype,
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
                  pressure_bar: metrics.pressure_bar || (isRunning ? 3.5 : 0.0),
                  flow_m3h: metrics.flow_m3h || (isRunning ? 45.0 : 0.0),
                  tank_level_pct: metrics.tank_level_pct || 75.0,
                  power_kw: metrics.power_kw || (isRunning ? 18.5 : 0.0),
                  current_a: metrics.current_a || (isRunning ? 32.0 : 0.0),
                  voltage_v: metrics.voltage_v || 380.0,
                  frequency_hz: metrics.frequency_hz || (isRunning ? 50.0 : 0.0),
                  motor_temp_c: metrics.motor_temp_c || (isRunning ? 45.0 : 25.0),
                  energy_kwh: metrics.energy_kwh || 0.0,
                },
              }
            })

            const m1Run = parsedPumps[0]?.status === 'RUNNING' ? 1 : 0
            const m2Run = parsedPumps[1]?.status === 'RUNNING' ? 1 : 0

            const avgP =
              parsedPumps.length > 0
                ? Math.max(...parsedPumps.map((p) => p.metrics.pressure_bar))
                : 0.0
            const sumF = parsedPumps.reduce((acc, p) => acc + p.metrics.flow_m3h, 0)
            const sumPow = parsedPumps.reduce((acc, p) => acc + p.metrics.power_kw, 0)

            const nameLower = a.name.toLowerCase()
            const descLower = ((a as any).description || '').toLowerCase()
            const isBoosterOrTransfer =
              nameLower.includes('booster') ||
              nameLower.includes('distribusi') ||
              nameLower.includes('transfer') ||
              descLower.includes('booster') ||
              descLower.includes('tanpa tangki') ||
              descLower.includes('no tank')

            const hasLevelSensor = areaSensors.some(
              (s: any) =>
                s.metric_code === 'water_level_m' ||
                s.metric_code === 'tank_level_pct' ||
                s.sensor_type === 'LEVEL_SENSOR' ||
                s.sensor_type === 'DISTANCE_SENSOR' ||
                s.code?.startsWith('LT-')
            )

            const hasTank = hasLevelSensor || (!isBoosterOrTransfer && (nameLower.includes('tank') || nameLower.includes('reservoir') || nameLower.includes('intake') || nameLower.includes('wtp') || idx === 0))

            return {
              id: a.id,
              code: a.code,
              name: a.name,
              number: `0${idx + 1}`,
              sensorTag: tagStr,
              basePressure: avgP > 1 ? avgP : 3.5,
              baseFlow: sumF > 5 ? sumF : 50.0,
              color: colorList[idx % colorList.length],
              hasTank,
              tankLevel: hasTank ? 75.0 : undefined,
              tankCapacityL: hasTank ? 5000 : undefined,
              motors: [m1Run, m2Run],
              pressure: avgP,
              flowRate: sumF,
              pumps: parsedPumps,
              history: {
                pressure: Array.from({ length: MAX_HISTORY_POINTS }, () => avgP),
                flowRate: Array.from({ length: MAX_HISTORY_POINTS }, () => sumF),
                power: Array.from({ length: MAX_HISTORY_POINTS }, () => sumPow),
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
                const targetPump = room.pumps.find(
                  (p) => p.id === data.asset_id || p.code === data.asset_code
                )
                if (!targetPump) return room

                const updatedPumps = room.pumps.map((pump) => {
                  if (pump.id === data.asset_id || pump.code === data.asset_code) {
                    const nextMetrics = { ...pump.metrics, ...(data.metrics || {}) }
                    return {
                      ...pump,
                      metrics: nextMetrics,
                      status:
                        data.metrics?.pump_running !== undefined
                          ? data.metrics.pump_running
                            ? ('RUNNING' as PumpStatus)
                            : ('STOPPED' as PumpStatus)
                          : pump.status,
                    }
                  }
                  return pump
                })

                const avgP =
                  updatedPumps.length > 0
                    ? Math.max(...updatedPumps.map((p) => p.metrics.pressure_bar || 0))
                    : 0
                const sumF = updatedPumps.reduce((acc, p) => acc + (p.metrics.flow_m3h || 0), 0)
                const sumPow = updatedPumps.reduce((acc, p) => acc + (p.metrics.power_kw || 0), 0)

                return {
                  ...room,
                  pressure: avgP > 0 ? avgP : room.pressure,
                  flowRate: sumF > 0 ? sumF : room.flowRate,
                  pumps: updatedPumps,
                  history: {
                    pressure: avgP > 0 ? [...room.history.pressure.slice(1), avgP] : room.history.pressure,
                    flowRate: sumF > 0 ? [...room.history.flowRate.slice(1), sumF] : room.history.flowRate,
                    power: sumPow > 0 ? [...room.history.power.slice(1), sumPow] : room.history.power,
                  },
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

  // Real-time clock update & dynamic physics step (only when offline / demo fallback)
  useEffect(() => {
    // If backend SSE is active, real data flows through SSE onMessage. Do not run local jitter.
    if (isBackendOnline && isLiveSSE) return

    const interval = setInterval(() => {
      const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':')
      setLastTime(nowStr)

      // Step rooms & pumps physics if active (offline fallback only)
      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          const m1Running = room.pumps[0]?.status === 'RUNNING' ? 1 : 0
          const m2Running = room.pumps[1]?.status === 'RUNNING' ? 1 : 0
          const activeMotorCount = room.pumps.filter((p) => p.status === 'RUNNING').length

          const targetP =
            activeMotorCount > 0
              ? room.basePressure + (activeMotorCount > 1 ? 0.65 : 0)
              : 0.0
          const targetF =
            activeMotorCount > 0
              ? room.baseFlow * (activeMotorCount > 1 ? 1.7 : 1)
              : 0.0

          const jitter = activeMotorCount > 0 ? 1 : 0
          const noiseP = (Math.random() - 0.5) * 0.08 * jitter
          const noiseF = (Math.random() - 0.5) * 1.5 * jitter

          let nextP = activeMotorCount > 0 ? room.pressure + (targetP - room.pressure) * 0.35 + noiseP : 0.0
          let nextF =
            activeMotorCount > 0
              ? room.flowRate + (targetF - room.flowRate) * 0.35 + noiseF
              : 0.0

          if (nextF < 0.05) nextF = 0
          if (nextP < 0) nextP = 0

          const newPressHist = [...room.history.pressure.slice(1), nextP]
          const newFlowHist = [...room.history.flowRate.slice(1), nextF]

          const totalPower = room.pumps.reduce(
            (acc, p) => acc + (p.status === 'RUNNING' ? p.metrics.power_kw || 18.5 : 0),
            0
          )
          const newPowerHist = [...room.history.power.slice(1), totalPower]

          const updatedPumps: PumpAsset[] = room.pumps.map((pump) => {
            const isRun = pump.status === 'RUNNING'
            return {
              ...pump,
              metrics: {
                ...pump.metrics,
                pressure_bar: isRun ? nextP : 0.0,
                flow_m3h: isRun ? (activeMotorCount > 1 ? nextF / activeMotorCount : nextF) : 0.0,
              },
            }
          })

          return {
            ...room,
            motors: [m1Running, m2Running],
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
    }, 5000)

    return () => clearInterval(interval)
  }, [isBackendOnline, isLiveSSE])

  // Toggle pump motor power (Issues remote command to Fastify backend)
  const togglePumpPower = useCallback(
    async (pumpIdOrRoomIdx: string | number, secondaryMotorIdx?: number) => {
      let targetPumpId: string | undefined
      let willBeRunning = false

      setRooms((prevRooms) => {
        let targetPump: PumpAsset | undefined
        let targetRoom: AreaRoom | undefined

        if (typeof pumpIdOrRoomIdx === 'string') {
          for (const room of prevRooms) {
            const found = room.pumps.find((p) => p.id === pumpIdOrRoomIdx)
            if (found) {
              targetPump = found
              targetRoom = room
              break
            }
          }
        } else {
          targetRoom = prevRooms[pumpIdOrRoomIdx]
          if (targetRoom && secondaryMotorIdx !== undefined) {
            targetPump = targetRoom.pumps[secondaryMotorIdx]
          }
        }

        if (!targetPump || !targetRoom) return prevRooms

        targetPumpId = targetPump.id
        willBeRunning = targetPump.status !== 'RUNNING'

        return prevRooms.map((room) => {
          if (room.id !== targetRoom!.id) return room

          const updatedPumps = room.pumps.map((p) => {
            if (p.id !== targetPump!.id) return p
            return {
              ...p,
              status: (willBeRunning ? 'RUNNING' : 'STOPPED') as PumpStatus,
              commandState: 'SENT' as const,
              metrics: {
                ...p.metrics,
                power_kw: willBeRunning ? 18.0 + Math.random() * 6 : 0,
                current_a: willBeRunning ? 30.0 + Math.random() * 12 : 0,
                frequency_hz: willBeRunning ? 50.0 : 0,
              },
            }
          })

          return {
            ...room,
            pumps: updatedPumps,
          }
        })
      })

      // 2. Send API Command to Backend
      if (isBackendOnline && targetPumpId) {
        const desiredState = willBeRunning ? 'ON' : 'OFF'
        try {
          await api.assets.issuePowerCommand(targetPumpId, {
            desired_state: desiredState,
            confirmation: true,
            note: `Operator UI command ${desiredState}`,
          })
        } catch (err) {
          console.warn('API command error:', err)
        }
      }
    },
    [isBackendOnline]
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
            pressure_bar: 0.0,
            flow_m3h: 0.0,
            tank_level_pct: targetRoom.tankLevel || 75,
            power_kw: 0.0,
            current_a: 0.0,
            voltage_v: 380.0,
            frequency_hz: 0.0,
            motor_temp_c: 25.0,
            energy_kwh: 0.0,
          },
        }

        const filteredExisting = targetRoom.pumps.filter((p) => p.id !== resolvedAssetId)
        const updatedPumps = [...filteredExisting, newPumpAsset]

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

  // Add IoT Gateway dynamically
  const addGateway = useCallback(
    async (input: { code: string; name: string; ip: string; firmware?: string; siteId?: string }) => {
      let resolvedGatewayId = `gw-${Date.now()}`
      if (isBackendOnline) {
        try {
          const res = await api.devices.create({
            site_id: siteInfo?.id || '00000000-0000-0000-0000-000000000001',
            code: input.code,
            name: input.name,
            device_type: 'EDGE_GATEWAY',
            firmware_version: input.firmware || '1.0.4',
            config: { ip_address: input.ip },
          })
          if (res?.success && res.data?.id) {
            resolvedGatewayId = res.data.id
          }
        } catch (err) {
          console.warn('Backend gateway create error:', err)
        }
      }

      const newGw: DeviceGateway = {
        id: resolvedGatewayId,
        code: input.code,
        name: input.name,
        siteId: input.siteId || siteInfo?.name || 'WTP Plant Bandung',
        status: 'ONLINE',
        lastSeen: new Date().toLocaleTimeString('id-ID').replace(/\./g, ':'),
        firmware: input.firmware || '1.0.4',
        rssi: -58,
        ip: input.ip || '192.168.1.100',
      }

      setGateways((prev) => [...prev, newGw])
    },
    [isBackendOnline, siteInfo]
  )

  // Delete IoT Gateway
  const deleteGateway = useCallback(
    async (gatewayId: string) => {
      setGateways((prev) => prev.filter((g) => g.id !== gatewayId))
      if (isBackendOnline) {
        api.devices.delete(gatewayId).catch(console.warn)
      }
    },
    [isBackendOnline]
  )

  // Delete pump asset (PRD Section 32 & Appendix B)
  const deletePump = useCallback(
    async (pumpId: string) => {
      if (isBackendOnline) {
        try {
          await api.assets.delete(pumpId)
          await fetchBackendData()
          return
        } catch (err) {
          console.warn('Backend pump asset delete error:', err)
        }
      }

      // Optimistic update for UI state: remove from room.pumps completely
      setRooms((prevRooms) =>
        prevRooms.map((room) => ({
          ...room,
          pumps: room.pumps.filter((p) => p.id !== pumpId),
        }))
      )
    },
    [isBackendOnline, fetchBackendData]
  )

  // Update pump asset
  const updatePump = useCallback(
    async (
      pumpId: string,
      payload: {
        code: string
        name: string
        subtype?: PumpSubtype
        areaId?: string
        deviceId?: string
        ratedPowerKw?: number
        ratedFlowM3h?: number
        ratedPressureBar?: number
        controlEnabled?: boolean
      }
    ) => {
      if (isBackendOnline) {
        try {
          await api.assets.update(pumpId, {
            code: payload.code,
            name: payload.name,
            asset_subtype: payload.subtype,
            area_id: payload.areaId,
            device_id: payload.deviceId,
            metadata: {
              rated_power_kw: payload.ratedPowerKw,
              rated_flow_m3h: payload.ratedFlowM3h,
              rated_pressure_bar: payload.ratedPressureBar,
              control_enabled: payload.controlEnabled,
            },
          })
          await fetchBackendData()
          return
        } catch (err) {
          console.warn('Backend pump asset update error:', err)
        }
      }

      // Optimistic update for UI
      setRooms((prevRooms) => {
        let targetPump: PumpAsset | null = null
        for (const r of prevRooms) {
          const found = r.pumps.find((p) => p.id === pumpId)
          if (found) {
            targetPump = found
            break
          }
        }
        if (!targetPump) return prevRooms

        const updatedPump: PumpAsset = {
          ...targetPump,
          code: payload.code,
          name: payload.name,
          controlEnabled: payload.controlEnabled ?? targetPump.controlEnabled,
          remoteAllowed: payload.controlEnabled ?? targetPump.remoteAllowed,
        }

        if (payload.areaId && payload.areaId !== targetPump.areaId) {
          return prevRooms.map((room) => {
            if (room.id === targetPump!.areaId) {
              return { ...room, pumps: room.pumps.filter((p) => p.id !== pumpId) }
            }
            if (room.id === payload.areaId) {
              return {
                ...room,
                pumps: [
                  ...room.pumps,
                  { ...updatedPump, areaId: room.id, areaName: room.name },
                ],
              }
            }
            return room
          })
        }

        return prevRooms.map((room) => ({
          ...room,
          pumps: room.pumps.map((p) => (p.id === pumpId ? updatedPump : p)),
        }))
      })
    },
    [isBackendOnline, fetchBackendData]
  )

  // Add new area / room dynamically
  const addArea = useCallback(
    async (input: { code: string; name: string; description?: string }) => {
      let resolvedId = `area-${Date.now()}`
      if (isBackendOnline) {
        try {
          const res = await api.areas.create({
            site_id: siteInfo?.id || '00000000-0000-0000-0000-000000000001',
            code: input.code,
            name: input.name,
            description: input.description,
          })
          if (res?.success && res.data?.id) {
            resolvedId = res.data.id
          }
        } catch (err) {
          console.warn('Backend area create error:', err)
        }
      }

      const colorList = ['var(--c1)', 'var(--c2)', 'var(--c3)', '#10B981', '#F59E0B', '#8B5CF6']
      const newRoom: AreaRoom = {
        id: resolvedId,
        code: input.code,
        name: input.name,
        number: `0${rooms.length + 1}`,
        sensorTag: `AREA-${input.code}`,
        basePressure: 3.5,
        baseFlow: 50.0,
        color: colorList[rooms.length % colorList.length],
        tankLevel: 75.0,
        motors: [0, 0],
        pressure: 0.0,
        flowRate: 0.0,
        pumps: [],
        history: {
          pressure: Array.from({ length: MAX_HISTORY_POINTS }, () => 0),
          flowRate: Array.from({ length: MAX_HISTORY_POINTS }, () => 0),
          power: Array.from({ length: MAX_HISTORY_POINTS }, () => 0),
        },
      }

      setRooms((prev) => [...prev, newRoom])
    },
    [isBackendOnline, siteInfo, rooms.length]
  )

  // Delete area / room
  const deleteArea = useCallback(
    async (areaId: string) => {
      if (isBackendOnline) {
        try {
          await api.areas.delete(areaId)
        } catch (err) {
          console.warn('Backend area delete error:', err)
        }
      }
      setRooms((prev) => prev.filter((r) => r.id !== areaId))
    },
    [isBackendOnline]
  )

  // Update area / room
  const updateArea = useCallback(
    async (areaId: string, input: { code?: string; name?: string; description?: string }) => {
      if (isBackendOnline) {
        try {
          await api.areas.update(areaId, input)
        } catch (err) {
          console.warn('Backend area update error:', err)
        }
      }

      setRooms((prev) =>
        prev.map((r) => {
          if (r.id !== areaId) return r
          return {
            ...r,
            code: input.code !== undefined ? input.code : r.code,
            name: input.name !== undefined ? input.name : r.name,
            sensorTag: input.code !== undefined ? `AREA-${input.code}` : r.sensorTag,
          }
        })
      )
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
    addArea,
    updateArea,
    deleteArea,
    addPump,
    updatePump,
    deletePump,
    addSensor,
    deleteSensor,
    addGateway,
    deleteGateway,
    togglePumpPower,
    toggleMotor: togglePumpPower,
    emergencyStop,
    acknowledgeAlarm,
  }
}
