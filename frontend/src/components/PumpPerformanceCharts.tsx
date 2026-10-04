import React, { useState } from 'react'
import type { AreaRoom, PumpAsset } from '../types/pump'
import {
  TrendingUp,
  BarChart3,
  Droplets,
  Zap,
  Thermometer,
  Layers,
  Activity,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts'

interface PumpPerformanceChartsProps {
  currentRoom: AreaRoom
  allRooms: AreaRoom[]
}

type BarMetric = 'power' | 'flow' | 'temp'

// Custom tooltip for real-time telemetry stream
const TelemetryTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-xl shadow-xl border border-slate-700/60 text-xs font-mono space-y-1.5 min-w-[150px]">
      <div className="text-[10px] text-slate-400 font-sans border-b border-slate-700/60 pb-1 flex items-center justify-between">
        <span>Timeline</span>
        <span className="font-semibold text-slate-300">{label}</span>
      </div>
      {payload.map((item: any) => (
        <div key={item.name} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-slate-300 font-sans text-[11px]">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: item.stroke || item.color }}
            />
            {item.name}:
          </span>
          <span className="font-bold text-white">
            {item.value !== undefined ? Number(item.value).toFixed(item.name.includes('Pressure') ? 2 : 1) : '-'}{' '}
            <span className="text-[10px] text-slate-400 font-normal">
              {item.name.includes('Pressure') ? 'bar' : 'm³/h'}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}

// Custom tooltip for pump load comparative bar chart
const PumpBarTooltip = ({ active, payload, unit }: any) => {
  if (!active || !payload || payload.length === 0) return null
  const data = payload[0].payload

  return (
    <div className="bg-slate-900/95 backdrop-blur-xs text-white p-2.5 rounded-xl shadow-xl border border-slate-700/60 text-xs font-mono min-w-[140px]">
      <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-1 mb-1 font-sans">
        <span className="font-bold text-sky-400">{data.code}</span>
        <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{data.name}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-slate-300 font-sans">Status:</span>
        <span
          className={`font-semibold text-[10px] uppercase ${
            data.status === 'RUNNING'
              ? 'text-emerald-400'
              : data.status === 'FAULT'
              ? 'text-rose-400'
              : 'text-slate-400'
          }`}
        >
          {data.status}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 mt-0.5">
        <span className="text-slate-300 font-sans">Nilai:</span>
        <span className="font-bold text-white">
          {Number(data.value).toFixed(1)} {unit}
        </span>
      </div>
    </div>
  )
}

export const PumpPerformanceCharts: React.FC<PumpPerformanceChartsProps> = ({
  currentRoom,
  allRooms,
}) => {
  const [barMetric, setBarMetric] = useState<BarMetric>('power')

  // 1. Prepare Telemetry Time-Series Data from room history
  const pressureHistory = currentRoom.history?.pressure || []
  const flowHistory = currentRoom.history?.flowRate || []
  const maxPoints = Math.max(pressureHistory.length, flowHistory.length, 1)

  const telemetryData = Array.from({ length: maxPoints }, (_, idx) => {
    const pVal = pressureHistory[idx] ?? currentRoom.pressure
    const fVal = flowHistory[idx] ?? currentRoom.flowRate
    const secondsAgo = (maxPoints - 1 - idx) * 2 // each sample ~2s interval
    return {
      time: secondsAgo === 0 ? 'Now' : `-${secondsAgo}s`,
      pressure: Number(pVal.toFixed(2)),
      flow: Number(fVal.toFixed(1)),
    }
  })

  // 2. Prepare Comparative Pump Data for the Bar Chart
  const pumpsToDisplay: PumpAsset[] =
    currentRoom.pumps.length > 0
      ? currentRoom.pumps
      : allRooms.flatMap((r) => r.pumps).slice(0, 6)

  const getMetricConfig = () => {
    switch (barMetric) {
      case 'power':
        return {
          title: 'Konsumsi Daya Motor (kW)',
          unit: 'kW',
          icon: Zap,
          color: '#d97706', // amber-600
          maxDomain: 35,
          getValue: (p: PumpAsset) => p.metrics?.power_kw || (p.status === 'RUNNING' ? 18.5 : 0),
        }
      case 'flow':
        return {
          title: 'Debit Aliran Pompa (m³/h)',
          unit: 'm³/h',
          icon: Droplets,
          color: '#0284c7', // sky-600
          maxDomain: 80,
          getValue: (p: PumpAsset) => p.metrics?.flow_m3h || (p.status === 'RUNNING' ? 35.0 : 0),
        }
      case 'temp':
        return {
          title: 'Suhu Operasi Motor (°C)',
          unit: '°C',
          icon: Thermometer,
          color: '#e11d48', // rose-600
          maxDomain: 90,
          getValue: (p: PumpAsset) => p.metrics?.motor_temp_c || (p.status === 'RUNNING' ? 48.0 : 25.0),
        }
    }
  }

  const metricConfig = getMetricConfig()

  const barChartData = pumpsToDisplay.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    status: p.status,
    value: metricConfig.getValue(p),
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 select-none">
      {/* 1. REAL-TIME TELEMETRY STREAM (Columns 1-7) */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
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

            {/* Current Values Badges */}
            <div className="flex items-center gap-2 text-[11px]">
              <div className="px-2.5 py-1 rounded-lg bg-[#00799e]/10 text-[#00799e] font-semibold font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00799e]" />
                Tekanan: {currentRoom.pressure.toFixed(2)} bar
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-semibold font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                Debit: {currentRoom.flowRate.toFixed(1)} m³/h
              </div>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="w-full h-48 sm:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="pressStreamGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00799e" stopOpacity={0.28} />
                    <stop offset="90%" stopColor="#00799e" stopOpacity={0.02} />
                    <stop offset="100%" stopColor="#00799e" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="flowStreamGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity={0.22} />
                    <stop offset="90%" stopColor="#0284c7" stopOpacity={0.02} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />

                {/* Left Y-Axis for Discharge Pressure (bar) */}
                <YAxis
                  yAxisId="press"
                  orientation="left"
                  domain={[0, (dataMax: number) => Math.max(6, Math.ceil(dataMax * 1.15))]}
                  tick={{ fontSize: 10, fill: '#00799e' }}
                  tickFormatter={(v) => `${Number(v).toFixed(1)}`}
                  tickLine={false}
                  axisLine={false}
                />

                {/* Right Y-Axis for Flow Rate (m³/h) */}
                <YAxis
                  yAxisId="flow"
                  orientation="right"
                  domain={[0, (dataMax: number) => Math.max(60, Math.ceil(dataMax * 1.15))]}
                  tick={{ fontSize: 10, fill: '#0284c7' }}
                  tickFormatter={(v) => `${Number(v).toFixed(0)}`}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip content={<TelemetryTooltip />} />

                <Area
                  yAxisId="press"
                  type="monotone"
                  dataKey="pressure"
                  name="Tekanan"
                  stroke="#00799e"
                  strokeWidth={2.5}
                  fill="url(#pressStreamGrad)"
                  isAnimationActive={false}
                />

                <Area
                  yAxisId="flow"
                  type="monotone"
                  dataKey="flow"
                  name="Debit Aliran"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fill="url(#flowStreamGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Polling Interval: 2.0s</span>
          </div>
          <span>Buffer: {maxPoints} Data Points</span>
        </div>
      </div>

      {/* 2. PUMP UNIT LOAD PERFORMANCE (Columns 8-12) */}
      <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
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

          {/* Bar Chart or Empty State */}
          {pumpsToDisplay.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center text-slate-400">
              <Layers className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-medium text-slate-600 m-0">Belum ada pompa di stasiun ini</p>
            </div>
          ) : (
            <div className="w-full h-48 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, metricConfig.maxDomain]}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="code"
                    tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                  />
                  <Tooltip content={<PumpBarTooltip unit={metricConfig.unit} />} />
                  <Bar
                    dataKey="value"
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                    isAnimationActive={false}
                  >
                    {barChartData.map((entry) => {
                      const fillColor =
                        entry.status === 'RUNNING'
                          ? metricConfig.color
                          : entry.status === 'FAULT'
                          ? '#ef4444'
                          : '#cbd5e1'
                      return <Cell key={entry.id} fill={fillColor} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            Stasiun: <strong className="text-slate-700 font-medium">{currentRoom.name}</strong>
          </span>
          <span className="text-slate-600 font-mono">
            {pumpsToDisplay.filter((p) => p.status === 'RUNNING').length}/{pumpsToDisplay.length} Beroperasi
          </span>
        </div>
      </div>
    </div>
  )
}
