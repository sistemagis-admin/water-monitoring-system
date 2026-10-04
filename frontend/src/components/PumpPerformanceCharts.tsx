import React, { useState } from 'react'
import type { AreaRoom, PumpAsset } from '../types/pump'
import {
  TrendingUp,
  BarChart3,
  Gauge,
  Droplets,
  Zap,
  Thermometer,
  Activity,
  Fan,
  Layers,
} from 'lucide-react'

interface PumpPerformanceChartsProps {
  currentRoom: AreaRoom
  allRooms: AreaRoom[]
}

export const PumpPerformanceCharts: React.FC<PumpPerformanceChartsProps> = ({
  currentRoom,
  allRooms,
}) => {
  const [barMetric, setBarMetric] = useState<'power' | 'flow' | 'temp'>('power')
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null)

  // 1. Line Chart Data Preparation
  const pressureHistory = currentRoom.history?.pressure || []
  const flowHistory = currentRoom.history?.flowRate || []
  const pointsCount = Math.max(pressureHistory.length, flowHistory.length, 1)

  // Normalize heights for SVG canvas (viewBox: 0 0 500 160)
  const svgWidth = 500
  const svgHeight = 160
  const paddingX = 20
  const paddingY = 20
  const chartW = svgWidth - paddingX * 2
  const chartH = svgHeight - paddingY * 2

  const maxP = Math.max(...pressureHistory, 6.0, 0.1)
  const maxF = Math.max(...flowHistory, 80.0, 1.0)

  // Generate SVG Points
  const pressurePoints = pressureHistory.map((val, idx) => {
    const x = paddingX + (idx / Math.max(pointsCount - 1, 1)) * chartW
    const y = svgHeight - paddingY - (val / maxP) * chartH
    return { x, y, val }
  })

  const flowPoints = flowHistory.map((val, idx) => {
    const x = paddingX + (idx / Math.max(pointsCount - 1, 1)) * chartW
    const y = svgHeight - paddingY - (val / maxF) * chartH
    return { x, y, val }
  })

  const pressurePath =
    pressurePoints.length > 0
      ? `M ${pressurePoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`
      : ''

  const flowPath =
    flowPoints.length > 0
      ? `M ${flowPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`
      : ''

  const pressureAreaPath =
    pressurePoints.length > 0
      ? `${pressurePath} L ${pressurePoints[pressurePoints.length - 1].x.toFixed(1)},${
          svgHeight - paddingY
        } L ${pressurePoints[0].x.toFixed(1)},${svgHeight - paddingY} Z`
      : ''

  const flowAreaPath =
    flowPoints.length > 0
      ? `${flowPath} L ${flowPoints[flowPoints.length - 1].x.toFixed(1)},${
          svgHeight - paddingY
        } L ${flowPoints[0].x.toFixed(1)},${svgHeight - paddingY} Z`
      : ''

  // 2. Bar Chart Data Preparation (Current room pumps or all pumps)
  const pumpsToDisplay: PumpAsset[] =
    currentRoom.pumps.length > 0
      ? currentRoom.pumps
      : allRooms.flatMap((r) => r.pumps).slice(0, 6)

  const getMetricConfig = () => {
    switch (barMetric) {
      case 'power':
        return {
          title: 'Konsumsi Daya Listrik (kW)',
          unit: 'kW',
          icon: Zap,
          color: 'from-amber-500 to-amber-600',
          bgColor: 'bg-amber-500',
          textColor: 'text-amber-600',
          maxVal: 30,
          getValue: (p: PumpAsset) => p.metrics?.power_kw || 0,
        }
      case 'flow':
        return {
          title: 'Debit Aliran Pompa (m³/h)',
          unit: 'm³/h',
          icon: Droplets,
          color: 'from-[#00799e] to-cyan-500',
          bgColor: 'bg-[#00799e]',
          textColor: 'text-[#00799e]',
          maxVal: 75,
          getValue: (p: PumpAsset) => p.metrics?.flow_m3h || 0,
        }
      case 'temp':
        return {
          title: 'Suhu Operasi Motor (°C)',
          unit: '°C',
          icon: Thermometer,
          color: 'from-rose-500 to-rose-600',
          bgColor: 'bg-rose-500',
          textColor: 'text-rose-600',
          maxVal: 80,
          getValue: (p: PumpAsset) => p.metrics?.motor_temp_c || 25,
        }
    }
  }

  const currentMetricConfig = getMetricConfig()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 select-none">
      {/* 1. LINE CHART: Tren Telemetri Real-Time (Columns 1-7) */}
      <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#00799e]/10 text-[#00799e] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-sm sm:text-base text-slate-900 m-0">
                  Tren Telemetri Real-Time
                </h3>
                <p className="text-[11px] text-slate-400 m-0 font-normal">
                  Fluktuasi tekanan hidrolik &amp; debit air stasiun {currentRoom.name}
                </p>
              </div>
            </div>

            {/* Legend Pills */}
            <div className="flex items-center gap-2 text-[11px]">
              <div className="px-2.5 py-1 rounded-lg bg-[#00799e]/10 border border-[#00799e]/20 text-[#00799e] font-semibold">
                Tekanan ({currentRoom.pressure.toFixed(2)} bar)
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 font-semibold">
                Debit ({currentRoom.flowRate.toFixed(1)} m³/h)
              </div>
            </div>
          </div>

          {/* SVG Line Chart Canvas */}
          <div className="relative w-full h-44 sm:h-52 overflow-hidden rounded-xl bg-slate-50/40 border border-slate-100/80">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full overflow-hidden"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Pressure Gradient Fill */}
                <linearGradient id="pressureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00799e" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#00799e" stopOpacity="0.0" />
                </linearGradient>
                {/* Flow Gradient Fill */}
                <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={svgWidth - paddingX}
                y2={paddingY}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <line
                x1={paddingX}
                y1={paddingY + chartH / 2}
                x2={svgWidth - paddingX}
                y2={paddingY + chartH / 2}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <line
                x1={paddingX}
                y1={svgHeight - paddingY}
                x2={svgWidth - paddingX}
                y2={svgHeight - paddingY}
                stroke="#cbd5e1"
                strokeWidth="1.2"
              />

              {/* Area Fills */}
              {flowAreaPath && (
                <path d={flowAreaPath} fill="url(#flowGradient)" className="transition-all duration-300" />
              )}
              {pressureAreaPath && (
                <path d={pressureAreaPath} fill="url(#pressureGradient)" className="transition-all duration-300" />
              )}

              {/* Flow Line */}
              {flowPath && (
                <path
                  d={flowPath}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              )}

              {/* Pressure Line */}
              {pressurePath && (
                <path
                  d={pressurePath}
                  fill="none"
                  stroke="#00799e"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              )}
            </svg>

            {/* Y-Axis Value Indicators */}
            <div className="absolute left-1 top-2 text-[9px] font-mono text-slate-400">
              {maxP.toFixed(1)} bar
            </div>
            <div className="absolute left-1 bottom-6 text-[9px] font-mono text-slate-400">
              0.0 bar
            </div>
            <div className="absolute right-1 top-2 text-[9px] font-mono text-cyan-600">
              {maxF.toFixed(0)} m³/h
            </div>
          </div>
        </div>

        {/* X-Axis Time Labels */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>-30s</span>
          <span>-20s</span>
          <span>-10s</span>
          <span>0s</span>
        </div>
      </div>

      {/* 2. BAR CHART: Performa & Distribusi Beban Pompa (Columns 8-12) */}
      <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        <div>
          {/* Header & Metric Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-sm sm:text-base text-slate-900 m-0">
                  Performa Unit Pompa
                </h3>
                <p className="text-[11px] text-slate-400 m-0 font-normal">
                  Komparasi beban kerja mesin
                </p>
              </div>
            </div>

            {/* Metric Switcher Tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-medium">
              <button
                type="button"
                onClick={() => setBarMetric('power')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  barMetric === 'power'
                    ? 'bg-white text-amber-600 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Daya (kW)
              </button>
              <button
                type="button"
                onClick={() => setBarMetric('flow')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  barMetric === 'flow'
                    ? 'bg-white text-[#00799e] font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Debit (m³/h)
              </button>
              <button
                type="button"
                onClick={() => setBarMetric('temp')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  barMetric === 'temp'
                    ? 'bg-white text-rose-600 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Suhu (°C)
              </button>
            </div>
          </div>

          {/* Bar Chart Items */}
          {pumpsToDisplay.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center text-slate-400">
              <Layers className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-medium text-slate-600 m-0">Belum ada pompa di stasiun ini</p>
            </div>
          ) : (
            <div className="space-y-3.5 my-2">
              {pumpsToDisplay.map((pump) => {
                const isRunning = pump.status === 'RUNNING'
                const val = currentMetricConfig.getValue(pump)
                const percentage = Math.min(Math.round((val / currentMetricConfig.maxVal) * 100), 100)

                return (
                  <div key={pump.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="px-1.5 py-0.2 rounded font-mono font-semibold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                          {pump.code}
                        </span>
                        <span className="font-medium text-slate-800 truncate">{pump.name}</span>
                      </div>

                      <div className="font-mono text-xs font-semibold text-slate-900 flex items-center gap-1">
                        <span className={isRunning ? currentMetricConfig.textColor : 'text-slate-400'}>
                          {val.toFixed(1)} {currentMetricConfig.unit}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">({percentage}%)</span>
                      </div>
                    </div>

                    {/* Progress Track Bar */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                          isRunning ? currentMetricConfig.color : 'from-slate-300 to-slate-300'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Stasiun: <strong className="text-slate-700 font-medium">{currentRoom.name}</strong></span>
          <span className="text-slate-600 font-mono">
            {pumpsToDisplay.filter((p) => p.status === 'RUNNING').length}/{pumpsToDisplay.length} Beroperasi
          </span>
        </div>
      </div>
    </div>
  )
}
