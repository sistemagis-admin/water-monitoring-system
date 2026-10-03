export interface LocationStation {
  id: string
  code: string
  name: string
  number: string
  sensorTag: string
  basePressure: number
  baseFlow: number
  motors: [number, number] // 0 = OFF, 1 = ON
  color: string
  pressure: number
  flowRate: number
  history: {
    pressure: number[]
    flowRate: number[]
  }
}

export interface SimulationStats {
  monitoredLocations: number
  runningMotors: number
  totalMotors: number
  avgPressure: number
  lastUpdated: string
}
