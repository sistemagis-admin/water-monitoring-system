import { useState, useEffect, useCallback } from 'react'
import type { LocationStation, SimulationStats } from '../types/pump'

const MAX_HISTORY_POINTS = 60

const INITIAL_STATIONS: LocationStation[] = [
  {
    id: 'bsm',
    code: 'BSM',
    name: 'Basement',
    number: '01',
    sensorTag: 'PT-01 / FT-01',
    basePressure: 3.2,
    baseFlow: 40,
    motors: [1, 0],
    color: 'var(--c1)',
    pressure: 3.2,
    flowRate: 39.8,
    history: {
      pressure: Array.from({ length: MAX_HISTORY_POINTS }, () => 3.2),
      flowRate: Array.from({ length: MAX_HISTORY_POINTS }, () => 39.8),
    },
  },
  {
    id: 'bsp',
    code: 'BSP',
    name: 'Booster Pump',
    number: '02',
    sensorTag: 'PT-02 / FT-02',
    basePressure: 4.6,
    baseFlow: 68,
    motors: [1, 0],
    color: 'var(--c2)',
    pressure: 4.58,
    flowRate: 67.5,
    history: {
      pressure: Array.from({ length: MAX_HISTORY_POINTS }, () => 4.58),
      flowRate: Array.from({ length: MAX_HISTORY_POINTS }, () => 67.5),
    },
  },
  {
    id: 'htp',
    code: 'HTP',
    name: 'Heater Pump',
    number: '03',
    sensorTag: 'PT-03 / FT-03',
    basePressure: 2.95,
    baseFlow: 55,
    motors: [0, 0],
    color: 'var(--c3)',
    pressure: 0.15,
    flowRate: 0.0,
    history: {
      pressure: Array.from({ length: MAX_HISTORY_POINTS }, () => 0.15),
      flowRate: Array.from({ length: MAX_HISTORY_POINTS }, () => 0.0),
    },
  },
]

export function usePumpSystem() {
  const [stations, setStations] = useState<LocationStation[]>(INITIAL_STATIONS)
  const [isSimulating, setIsSimulating] = useState<boolean>(true)
  const [lastTime, setLastTime] = useState<string>(() =>
    new Date().toLocaleTimeString('id-ID').replace(/\./g, ':')
  )

  // Toggle individual motor
  const toggleMotor = useCallback((stationIndex: number, motorIndex: 0 | 1) => {
    setStations((prev) =>
      prev.map((station, idx) => {
        if (idx !== stationIndex) return station
        const newMotors = [...station.motors] as [number, number]
        newMotors[motorIndex] = newMotors[motorIndex] === 1 ? 0 : 1
        return {
          ...station,
          motors: newMotors,
        }
      })
    )
  }, [])

  // Emergency stop all motors
  const emergencyStop = useCallback(() => {
    setStations((prev) =>
      prev.map((station) => ({
        ...station,
        motors: [0, 0],
      }))
    )
  }, [])

  // Step physics tick every second
  useEffect(() => {
    if (!isSimulating) return

    const interval = setInterval(() => {
      const nowStr = new Date().toLocaleTimeString('id-ID').replace(/\./g, ':')
      setLastTime(nowStr)

      setStations((prev) =>
        prev.map((station) => {
          const activeMotorCount = station.motors[0] + station.motors[1]
          const targetP = activeMotorCount > 0
            ? station.basePressure + (activeMotorCount > 1 ? 0.7 : 0)
            : 0.15
          const targetF = activeMotorCount > 0
            ? station.baseFlow * (activeMotorCount > 1 ? 1.7 : 1)
            : 0

          const jitter = activeMotorCount > 0 ? 1 : 0
          const noiseP = (Math.random() - 0.5) * 0.08 * jitter
          const noiseF = (Math.random() - 0.5) * 1.6

          // Calculate new pressure and flow rate
          let nextP = station.pressure + (targetP - station.pressure) * 0.35 + noiseP
          let nextF = activeMotorCount > 0
            ? station.flowRate + (targetF - station.flowRate) * 0.35 + noiseF
            : Math.max(0, station.flowRate * 0.5 - 0.2)

          if (nextF < 0.05) nextF = 0
          if (nextP < 0) nextP = 0

          // Update rolling history buffer
          const newPressHist = [...station.history.pressure.slice(1), nextP]
          const newFlowHist = [...station.history.flowRate.slice(1), nextF]

          return {
            ...station,
            pressure: nextP,
            flowRate: nextF,
            history: {
              pressure: newPressHist,
              flowRate: newFlowHist,
            },
          }
        })
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [isSimulating])

  // Aggregate Stats
  const runningMotors = stations.reduce(
    (acc, s) => acc + s.motors[0] + s.motors[1],
    0
  )
  const avgPressure = +(
    stations.reduce((acc, s) => acc + s.pressure, 0) / (stations.length || 1)
  ).toFixed(2)

  const stats: SimulationStats = {
    monitoredLocations: stations.length,
    runningMotors,
    totalMotors: stations.length * 2,
    avgPressure,
    lastUpdated: lastTime,
  }

  return {
    stations,
    stats,
    isSimulating,
    setIsSimulating,
    toggleMotor,
    emergencyStop,
  }
}
