import React, { useState } from 'react'
import type { LocationStation } from '../types/pump'
import { Gauge, Waves, Activity, Layers, Flame } from 'lucide-react'

interface TrendChartProps {
  stations: LocationStation[]
}

export const TrendChart: React.FC<TrendChartProps> = ({ stations }) => {
  const [metricMode, setMetricMode] = useState<'pressure' | 'flowRate'>('pressure')

  const maxVal = metricMode === 'pressure' ? 10 : 120
  const unit = metricMode === 'pressure' ? 'bar' : 'L/min'
  const numPoints = 60

  // 4 Y-axis step levels
  const yTicks = [
    { ratio: 1.0, label: `${maxVal.toFixed(metricMode === 'pressure' ? 1 : 0)} ${unit}` },
    { ratio: 0.67, label: `${(maxVal * 0.67).toFixed(metricMode === 'pressure' ? 1 : 0)} ${unit}` },
    { ratio: 0.33, label: `${(maxVal * 0.33).toFixed(metricMode === 'pressure' ? 1 : 0)} ${unit}` },
    { ratio: 0.0, label: `0.0 ${unit}` },
  ]

  if (!stations || stations.length === 0) {
    return (
      <section className="bg-[var(--card)] border border-[var(--line)] rounded-[22px] p-8 shadow-xs text-center flex flex-col items-center justify-center text-slate-400">
        <Activity className="w-8 h-8 text-slate-400 mb-2 animate-pulse" />
        <p className="font-bold text-sm text-slate-700 m-0">Menunggu Telemetri Stasiun Pompa...</p>
        <span className="text-xs text-slate-500">Memuat topologi plant dan aliran telemetri dari backend.</span>
      </section>
    )
  }

  return (
    <section className="bg-[var(--card)] border border-[var(--line)] rounded-[22px] p-5 sm:p-6 shadow-xs transition-all">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[var(--ink)] m-0">
            Tren Pembacaan Telemetri
          </h2>
          <p className="text-xs text-[var(--mut)] m-0 mt-0.5">
            Pemantauan data sensor tekanan &amp; debit secara kontinu (60 detik terakhir)
          </p>
        </div>

        {/* Metric Switch Tabs */}
        <div className="inline-flex bg-[var(--cas)] rounded-xl p-1 border border-[var(--line)] self-start sm:self-auto">
          <button
            onClick={() => setMetricMode('pressure')}
            className={`flex items-center gap-1.5 font-semibold text-xs py-2 px-3.5 rounded-lg cursor-pointer transition-all ${
              metricMode === 'pressure'
                ? 'bg-[var(--card)] text-[var(--ink)] shadow-xs font-bold'
                : 'text-[var(--mut)] hover:text-[var(--ink)]'
            }`}
          >
            <Gauge className="w-3.5 h-3.5 text-[var(--water)]" />
            <span>Tekanan (bar)</span>
          </button>
          <button
            onClick={() => setMetricMode('flowRate')}
            className={`flex items-center gap-1.5 font-semibold text-xs py-2 px-3.5 rounded-lg cursor-pointer transition-all ${
              metricMode === 'flowRate'
                ? 'bg-[var(--card)] text-[var(--ink)] shadow-xs font-bold'
                : 'text-[var(--mut)] hover:text-[var(--ink)]'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-[var(--c2)]" />
            <span>Debit (L/min)</span>
          </button>
        </div>
      </div>

      {/* Main Chart Area: HTML Y-Axis Labels + SVG Canvas */}
      <div className="flex gap-3 items-stretch">
        {/* Crisp HTML Y-Axis Labels (No SVG text stretching) */}
        <div className="flex flex-col justify-between py-1 text-right select-none w-16 sm:w-20 shrink-0">
          {yTicks.map((tick, idx) => (
            <span
              key={idx}
              className="text-[11px] sm:text-xs font-mono font-medium text-[var(--mut)] tabular-nums"
            >
              {tick.label}
            </span>
          ))}
        </div>

        {/* SVG Drawing Canvas */}
        <div className="flex-1 flex flex-col">
          <div className="w-full h-[220px] rounded-xl bg-[var(--cas)]/35 border border-[var(--line)]/60 relative overflow-hidden">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-3.5 px-0">
              <div className="w-full border-b border-[var(--line)]/50 border-dashed" />
              <div className="w-full border-b border-[var(--line)]/50 border-dashed" />
              <div className="w-full border-b border-[var(--line)]/50 border-dashed" />
              <div className="w-full border-b border-[var(--line)]/50 border-dashed" />
            </div>

            {/* SVG Data Curves */}
            <svg
              className="w-full h-full block"
              viewBox="0 0 900 220"
              preserveAspectRatio="none"
              aria-label="Grafik tren sensor"
            >
              {/* Draw stroke paths for each station */}
              {stations.map((station) => {
                const historyData =
                  metricMode === 'pressure'
                    ? station.history?.pressure || []
                    : station.history?.flowRate || []

                if (historyData.length < 2) return null

                const points = historyData.map((val, idx) => {
                  const x = ((idx / (numPoints - 1)) * 900).toFixed(1)
                  const clampedVal = Math.min(Math.max(val, 0), maxVal)
                  const y = (205 - (clampedVal / maxVal) * 190).toFixed(1)
                  return { x, y }
                })

                const pathD = points.reduce(
                  (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`,
                  ''
                )
                const lastPoint = points[points.length - 1]

                return (
                  <g key={station.id}>
                    {/* Main Telemetry Line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={station.color || 'var(--amp-teal)'}
                      strokeWidth="3"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      style={{ vectorEffect: 'non-scaling-stroke' }}
                    />

                    {/* Active Endpoint Beacon */}
                    {lastPoint && (
                      <circle
                        cx={lastPoint.x}
                        cy={lastPoint.y}
                        r="4.5"
                        fill={station.color || 'var(--amp-teal)'}
                        stroke="var(--card)"
                        strokeWidth="1.5"
                      />
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          {/* X-Axis Timeline Markers */}
          <div className="flex justify-between text-[11px] font-mono text-[var(--mut)] pt-1.5 px-1 select-none">
            <span>-60 detik</span>
            <span>-40 detik</span>
            <span>-20 detik</span>
            <span className="font-bold text-[var(--ink)]">
              Sekarang
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Legend Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-[var(--line)]">
        {stations.map((station) => {
          const currentVal =
            metricMode === 'pressure'
              ? `${(station.pressure || 0).toFixed(2)} bar`
              : `${(station.flowRate || 0).toFixed(1)} L/min`

          const activeCount = (station.motors?.[0] || 0) + (station.motors?.[1] || 0)

          const renderIcon = () => {
            if (station.id.includes('01') || station.name.toLowerCase().includes('basement')) {
              return <Layers className="w-3.5 h-3.5 text-white" />
            }
            if (station.id.includes('02') || station.name.toLowerCase().includes('booster')) {
              return <Gauge className="w-3.5 h-3.5 text-white" />
            }
            if (station.id.includes('03') || station.name.toLowerCase().includes('heater')) {
              return <Flame className="w-3.5 h-3.5 text-white" />
            }
            return <Activity className="w-3.5 h-3.5 text-white" />
          }

          return (
            <div
              key={station.id}
              className="flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-[var(--cas)]/40 border border-[var(--line)]/60"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg shrink-0 shadow-xs flex items-center justify-center"
                  style={{ backgroundColor: station.color || 'var(--amp-teal)' }}
                >
                  {renderIcon()}
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-[13px] text-[var(--ink)] leading-tight m-0">
                    {station.name}
                  </h4>
                  <span className="text-[10px] text-[var(--mut)]">
                    {activeCount > 0 ? `${activeCount} motor aktif` : 'Standby'}
                  </span>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="font-extrabold text-sm sm:text-base tabular-nums text-[var(--ink)]">
                  {currentVal}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
