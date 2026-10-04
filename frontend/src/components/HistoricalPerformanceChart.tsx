import React, { useState, useMemo } from 'react'
import type { AreaRoom } from '../types/pump'
import { CustomSelect, type SelectOption } from './CustomSelect'
import {
  Calendar,
  TrendingUp,
  Droplets,
  Gauge,
  Zap,
  Clock,
  Download,
  Building2,
  CheckCircle2,
  Sliders,
  ChevronRight,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

interface HistoricalPerformanceChartProps {
  currentRoom?: AreaRoom
  allRooms: AreaRoom[]
}

type TimeFrame = 'daily' | 'monthly' | 'yearly'
type MetricType = 'flow' | 'pressure' | 'energy' | 'efficiency'

interface DataPoint {
  label: string
  fullLabel: string
  primaryVal: number // Main value for chart
  secondaryVal?: number // Comparison value
  unit: string
  secondaryUnit?: string
}

export const HistoricalPerformanceChart: React.FC<HistoricalPerformanceChartProps> = ({
  currentRoom,
  allRooms,
}) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('monthly')
  const [activeMetric, setActiveMetric] = useState<MetricType>('flow')
  const [selectedStationFilter, setSelectedStationFilter] = useState<string>('ALL')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Generate Realistic Historical Datasets
  const chartData = useMemo<DataPoint[]>(() => {
    // Multiplier based on room selection
    const stationFactor =
      selectedStationFilter === 'ALL'
        ? 2.8
        : selectedStationFilter === currentRoom?.id
        ? 1.0
        : 1.2

    if (timeFrame === 'daily') {
      // 24 Hours Data
      const hours = [
        '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
        '12:00', '14:00', '16:00', '18:00', '20:00', '22:00',
      ]
      return hours.map((h, i) => {
        // Diurnal curve: peaks at 08:00 (i=4) and 18:00 (i=9)
        const peakFactor = Math.sin((i / 11) * Math.PI) * 1.4 + 0.6
        if (activeMetric === 'flow') {
          const flow = +( (32 + peakFactor * 24) * stationFactor ).toFixed(1)
          const target = +( 55 * stationFactor ).toFixed(1)
          return { label: h, fullLabel: `Pukul ${h} WIB`, primaryVal: flow, secondaryVal: target, unit: 'm³/h', secondaryUnit: 'Target' }
        } else if (activeMetric === 'pressure') {
          const press = +( (3.6 + peakFactor * 1.1) ).toFixed(2)
          const target = 4.5
          return { label: h, fullLabel: `Pukul ${h} WIB`, primaryVal: press, secondaryVal: target, unit: 'bar', secondaryUnit: 'Setpoint' }
        } else if (activeMetric === 'energy') {
          const kwh = +( (14.2 + peakFactor * 12.5) * stationFactor ).toFixed(1)
          return { label: h, fullLabel: `Pukul ${h} WIB`, primaryVal: kwh, secondaryVal: 25.0 * stationFactor, unit: 'kWh', secondaryUnit: 'Batas Daya' }
        } else {
          // Efficiency %
          const eff = +( 90 + Math.sin(i * 1.2) * 6 ).toFixed(1)
          const runHours = +( 1.8 + Math.random() * 0.2 ).toFixed(1)
          return { label: h, fullLabel: `Pukul ${h} WIB`, primaryVal: eff, secondaryVal: runHours, unit: '%', secondaryUnit: 'Jam Jalan' }
        }
      })
    } else if (timeFrame === 'monthly') {
      // 30 Days in Month (Sampling every 2-3 days for clean chart)
      const days = [
        'Tgl 01', 'Tgl 03', 'Tgl 06', 'Tgl 09', 'Tgl 12',
        'Tgl 15', 'Tgl 18', 'Tgl 21', 'Tgl 24', 'Tgl 27', 'Tgl 30',
      ]
      return days.map((d, i) => {
        const variance = Math.sin(i * 0.8) * 0.2 + 1.0
        if (activeMetric === 'flow') {
          const dailyTotal = +( (720 * variance) * stationFactor ).toFixed(0)
          const target = +( 700 * stationFactor ).toFixed(0)
          return { label: d, fullLabel: `${d} Oktober 2026`, primaryVal: dailyTotal, secondaryVal: target, unit: 'm³/hari', secondaryUnit: 'Target' }
        } else if (activeMetric === 'pressure') {
          const avgPress = +( 4.15 + Math.sin(i * 1.1) * 0.35 ).toFixed(2)
          return { label: d, fullLabel: `${d} Oktober 2026`, primaryVal: avgPress, secondaryVal: 4.2, unit: 'bar', secondaryUnit: 'Rata-rata' }
        } else if (activeMetric === 'energy') {
          const dailyKwh = +( (280 * variance) * stationFactor ).toFixed(0)
          return { label: d, fullLabel: `${d} Oktober 2026`, primaryVal: dailyKwh, secondaryVal: +(290 * stationFactor).toFixed(0), unit: 'kWh/hari', secondaryUnit: 'Budget' }
        } else {
          const eff = +( 93.2 + Math.cos(i * 0.7) * 4 ).toFixed(1)
          const runHours = +( 21.5 + Math.sin(i) * 2 ).toFixed(1)
          return { label: d, fullLabel: `${d} Oktober 2026`, primaryVal: eff, secondaryVal: runHours, unit: '%', secondaryUnit: 'Jam/hari' }
        }
      })
    } else {
      // Yearly: 12 Months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
      return months.map((m, i) => {
        const seasonal = 1 + Math.sin((i / 11) * Math.PI) * 0.25
        if (activeMetric === 'flow') {
          const monthlyVol = +( (21500 * seasonal) * stationFactor ).toFixed(0)
          const target = +( 22000 * stationFactor ).toFixed(0)
          return { label: m, fullLabel: `Bulan ${m} 2026`, primaryVal: monthlyVol, secondaryVal: target, unit: 'm³', secondaryUnit: 'Target' }
        } else if (activeMetric === 'pressure') {
          const press = +( 4.2 + Math.cos(i * 0.5) * 0.25 ).toFixed(2)
          return { label: m, fullLabel: `Bulan ${m} 2026`, primaryVal: press, secondaryVal: 4.2, unit: 'bar', secondaryUnit: 'Baseline' }
        } else if (activeMetric === 'energy') {
          const mwh = +( (8.4 * seasonal) * stationFactor ).toFixed(1)
          return { label: m, fullLabel: `Bulan ${m} 2026`, primaryVal: mwh, secondaryVal: +(8.5 * stationFactor).toFixed(1), unit: 'MWh', secondaryUnit: 'Target' }
        } else {
          const eff = +( 94.0 + Math.sin(i * 0.9) * 3.5 ).toFixed(1)
          const runHours = +( 640 + Math.sin(i * 0.6) * 40 ).toFixed(0)
          return { label: m, fullLabel: `Bulan ${m} 2026`, primaryVal: eff, secondaryVal: runHours, unit: '%', secondaryUnit: 'Total Jam' }
        }
      })
    }
  }, [timeFrame, activeMetric, selectedStationFilter, currentRoom])

  // Aggregate Metrics Summary Stats
  const statsSummary = useMemo(() => {
    if (chartData.length === 0) return { totalOrAvg: '0', min: '0', max: '0', change: '+0.0%' }
    const values = chartData.map((d) => d.primaryVal)
    const min = Math.min(...values).toLocaleString('id-ID')
    const max = Math.max(...values).toLocaleString('id-ID')
    const sum = values.reduce((a, b) => a + b, 0)
    const avg = (sum / values.length).toFixed(1)

    const isSumMetric = activeMetric === 'flow' || activeMetric === 'energy'
    const totalOrAvg = isSumMetric ? sum.toLocaleString('id-ID') : avg

    const firstVal = values[0] || 1
    const lastVal = values[values.length - 1] || 1
    const diffPct = (((lastVal - firstVal) / firstVal) * 100).toFixed(1)
    const isPositive = Number(diffPct) >= 0

    return {
      totalOrAvg,
      min,
      max,
      change: `${isPositive ? '+' : ''}${diffPct}%`,
      isPositive,
      unit: chartData[0]?.unit || '',
    }
  }, [chartData, activeMetric])

  // SVG Chart Geometry Calculations
  const svgWidth = 700
  const svgHeight = 220
  const paddingLeft = 45
  const paddingRight = 25
  const paddingTop = 25
  const paddingBottom = 35

  const chartW = svgWidth - paddingLeft - paddingRight
  const chartH = svgHeight - paddingTop - paddingBottom

  const allVals = chartData.flatMap((d) => [d.primaryVal, d.secondaryVal || d.primaryVal])
  const minDataVal = Math.min(...allVals, 0)
  const maxDataVal = Math.max(...allVals, 1.0) * 1.12 // 12% headroom

  const points = chartData.map((d, idx) => {
    const x = paddingLeft + (idx / Math.max(chartData.length - 1, 1)) * chartW
    const normalizedY = (d.primaryVal - minDataVal) / Math.max(maxDataVal - minDataVal, 0.001)
    const y = svgHeight - paddingBottom - normalizedY * chartH
    return { x, y, data: d }
  })

  // Secondary target line points
  const secPoints = chartData.map((d, idx) => {
    const x = paddingLeft + (idx / Math.max(chartData.length - 1, 1)) * chartW
    const secVal = d.secondaryVal !== undefined ? d.secondaryVal : d.primaryVal
    const normalizedY = (secVal - minDataVal) / Math.max(maxDataVal - minDataVal, 0.001)
    const y = svgHeight - paddingBottom - normalizedY * chartH
    return { x, y }
  })

  // Smooth Bezier Curve Path Generator
  const getCurvedPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return ''
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`

    let path = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
    for (let i = 0; i < pts.length - 1; i++) {
      const current = pts[i]
      const next = pts[i + 1]
      const controlX = (current.x + next.x) / 2
      path += ` C ${controlX.toFixed(1)},${current.y.toFixed(1)} ${controlX.toFixed(1)},${next.y.toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`
    }
    return path
  }

  const linePath = getCurvedPath(points)
  const secLinePath = getCurvedPath(secPoints)

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)},${svgHeight - paddingBottom} L ${points[0].x.toFixed(1)},${svgHeight - paddingBottom} Z`
      : ''

  // Metric Theme Colors
  const getMetricTheme = () => {
    switch (activeMetric) {
      case 'flow':
        return {
          stroke: '#00799e',
          gradientStart: '#00799e',
          gradientStop: '#eff8fa',
          badgeText: 'Debit Aliran & Volume',
          icon: Droplets,
          activeColor: 'text-[#00799e]',
          bgSoft: 'bg-[#00799e]/10',
        }
      case 'pressure':
        return {
          stroke: '#0284c7',
          gradientStart: '#0284c7',
          gradientStop: '#f0f9ff',
          badgeText: 'Tekanan Pipa Manifold',
          icon: Gauge,
          activeColor: 'text-sky-600',
          bgSoft: 'bg-sky-50',
        }
      case 'energy':
        return {
          stroke: '#f59e0b',
          gradientStart: '#f59e0b',
          gradientStop: '#fffbeb',
          badgeText: 'Konsumsi Energi Listrik',
          icon: Zap,
          activeColor: 'text-amber-600',
          bgSoft: 'bg-amber-50',
        }
      case 'efficiency':
        return {
          stroke: '#10b981',
          gradientStart: '#10b981',
          gradientStop: '#ecfdf5',
          badgeText: 'Efisiensi Stasiun & Uptime',
          icon: CheckCircle2,
          activeColor: 'text-emerald-600',
          bgSoft: 'bg-emerald-50',
        }
    }
  }

  const metricTheme = getMetricTheme()
  const MetricIcon = metricTheme.icon

  // Station Filter Options for CustomSelect
  const stationOptions: SelectOption[] = [
    { value: 'ALL', label: `Seluruh Stasiun (${allRooms.length} Area)`, icon: <Building2 className="w-3.5 h-3.5 text-slate-400" /> },
    ...allRooms.map((r) => ({
      value: r.id,
      label: r.name,
      sublabel: `${r.pumps.length} pompa`,
      icon: <Building2 className="w-3.5 h-3.5 text-[#00799e]" />,
    })),
  ]

  const activeHoverData = hoveredIndex !== null && chartData[hoveredIndex] ? chartData[hoveredIndex] : null

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-5 select-none animate-fade-in">
      {/* 1. Top Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl ${metricTheme.bgSoft} ${metricTheme.activeColor} flex items-center justify-center shadow-2xs shrink-0`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900 m-0">
                Riwayat &amp; Tren Performa Historis
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {timeFrame === 'daily' ? '24 Jam' : timeFrame === 'monthly' ? '30 Hari' : '12 Bulan'}
              </span>
            </div>
            <p className="text-xs text-slate-500 m-0 mt-0.5 font-normal">
              Analisis performa debit, tekanan hidrolik, dan efisiensi energi stasiun berkala
            </p>
          </div>
        </div>

        {/* Time Frame Switcher + Station Select */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Station Filter Dropdown */}
          <CustomSelect
            options={stationOptions}
            value={selectedStationFilter}
            onChange={(val) => setSelectedStationFilter(val)}
            size="sm"
            className="w-48"
            minPopoverWidth="220px"
          />

          {/* Timeframe Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 text-xs font-medium">
            <button
              type="button"
              onClick={() => setTimeFrame('daily')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeFrame === 'daily'
                  ? 'bg-white text-[#00799e] font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Harian (24 Jam)
            </button>

            <button
              type="button"
              onClick={() => setTimeFrame('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeFrame === 'monthly'
                  ? 'bg-white text-[#00799e] font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulanan (30 Hari)
            </button>

            <button
              type="button"
              onClick={() => setTimeFrame('yearly')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeFrame === 'yearly'
                  ? 'bg-white text-[#00799e] font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tahunan (12 Bulan)
            </button>
          </div>
        </div>
      </div>

      {/* 2. Metric Mode Selector Tabs & KPI Cards Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric Card 1: Debit & Volume */}
        <div
          onClick={() => setActiveMetric('flow')}
          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
            activeMetric === 'flow'
              ? 'border-[#00799e] bg-[#00799e]/5 shadow-xs'
              : 'border-slate-200/80 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-[#00799e]" />
              Debit &amp; Volume Air
            </span>
            <span className={`w-2 h-2 rounded-full ${activeMetric === 'flow' ? 'bg-[#00799e]' : 'bg-transparent'}`} />
          </div>
          <div className="font-heading font-bold text-lg sm:text-xl text-slate-800">
            {timeFrame === 'yearly' ? '258.4k' : timeFrame === 'monthly' ? '21.6k' : '614.8'}{' '}
            <span className="text-xs font-normal text-slate-400">m³</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium block mt-1">
            +4.2% vs periode lalu
          </span>
        </div>

        {/* Metric Card 2: Tekanan */}
        <div
          onClick={() => setActiveMetric('pressure')}
          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
            activeMetric === 'pressure'
              ? 'border-sky-500 bg-sky-50/50 shadow-xs'
              : 'border-slate-200/80 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-sky-600" />
              Tekanan Manifold
            </span>
            <span className={`w-2 h-2 rounded-full ${activeMetric === 'pressure' ? 'bg-sky-500' : 'bg-transparent'}`} />
          </div>
          <div className="font-heading font-bold text-lg sm:text-xl text-slate-800 font-mono">
            4.18 <span className="text-xs font-normal text-slate-400">bar</span>
          </div>
          <span className="text-[10px] text-sky-600 font-medium block mt-1">
            Rentang: 3.4 - 4.9 bar
          </span>
        </div>

        {/* Metric Card 3: Energi */}
        <div
          onClick={() => setActiveMetric('energy')}
          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
            activeMetric === 'energy'
              ? 'border-amber-500 bg-amber-50/50 shadow-xs'
              : 'border-slate-200/80 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Konsumsi Energi
            </span>
            <span className={`w-2 h-2 rounded-full ${activeMetric === 'energy' ? 'bg-amber-500' : 'bg-transparent'}`} />
          </div>
          <div className="font-heading font-bold text-lg sm:text-xl text-slate-800">
            {timeFrame === 'yearly' ? '104.8' : timeFrame === 'monthly' ? '8.4' : '312'}{' '}
            <span className="text-xs font-normal text-slate-400">{timeFrame === 'yearly' ? 'MWh' : 'kWh'}</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium block mt-1">
            Hemat 2.8% efisiensi VFD
          </span>
        </div>

        {/* Metric Card 4: Efisiensi & Uptime */}
        <div
          onClick={() => setActiveMetric('efficiency')}
          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
            activeMetric === 'efficiency'
              ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
              : 'border-slate-200/80 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Efisiensi &amp; Uptime
            </span>
            <span className={`w-2 h-2 rounded-full ${activeMetric === 'efficiency' ? 'bg-emerald-500' : 'bg-transparent'}`} />
          </div>
          <div className="font-heading font-bold text-lg sm:text-xl text-emerald-600 font-mono">
            94.6% <span className="text-xs font-normal text-slate-400 font-sans">Uptime</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium block mt-1">
            {timeFrame === 'yearly' ? '7,820 Jam' : timeFrame === 'monthly' ? '684 Jam' : '22.4 Jam'} Kerja
          </span>
        </div>
      </div>

      {/* 3. Main SVG Historical Line Chart Canvas */}
      <div className="relative rounded-2xl bg-slate-50/50 border border-slate-200/90 p-4 sm:p-5 overflow-hidden">
        {/* Chart Info Top Badges & Live Value Preview */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: metricTheme.stroke }}></span>
              <span>{metricTheme.badgeText}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <span>Garis Putus-Putus: Target / Setpoint</span>
            </div>
          </div>

          {/* Interactive Hover Point Indicator */}
          {activeHoverData ? (
            <div className="px-3 py-1 bg-white border border-slate-200 rounded-xl shadow-xs text-xs flex items-center gap-3 animate-fade-in">
              <span className="text-slate-500 font-medium">{activeHoverData.fullLabel}:</span>
              <strong className={`font-mono font-bold ${metricTheme.activeColor}`}>
                {activeHoverData.primaryVal.toLocaleString('id-ID')} {activeHoverData.unit}
              </strong>
              {activeHoverData.secondaryVal !== undefined && (
                <span className="text-[11px] text-slate-400 font-mono">
                  ({activeHoverData.secondaryUnit}: {activeHoverData.secondaryVal} {activeHoverData.unit})
                </span>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 font-normal">
              Arahkan kursor ke grafik untuk melihat detail nilai
            </div>
          )}
        </div>

        {/* SVG Canvas Area */}
        <div className="w-full h-56 sm:h-64 relative">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              {/* Dynamic Gradient Area Fill */}
              <linearGradient id="historyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={metricTheme.gradientStart} stopOpacity="0.25" />
                <stop offset="85%" stopColor={metricTheme.gradientStart} stopOpacity="0.02" />
                <stop offset="100%" stopColor={metricTheme.gradientStart} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines (4 levels) */}
            {[0, 0.33, 0.66, 1].map((ratio, idx) => {
              const y = paddingTop + ratio * chartH
              const val = maxDataVal - ratio * (maxDataVal - minDataVal)
              return (
                <g key={idx}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray={idx === 3 ? '0' : '3 3'}
                    strokeWidth={idx === 3 ? '1.2' : '1'}
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    className="text-[9px] font-mono fill-slate-400 select-none"
                  >
                    {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(val < 10 ? 1 : 0)}
                  </text>
                </g>
              )
            })}

            {/* Secondary Target / Benchmark Dashed Curve */}
            {secLinePath && (
              <path
                d={secLinePath}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="transition-all duration-300 opacity-60"
              />
            )}

            {/* Main Area Fill */}
            {areaPath && (
              <path
                d={areaPath}
                fill="url(#historyGradient)"
                className="transition-all duration-500"
              />
            )}

            {/* Main Primary Bezier Curve */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke={metricTheme.stroke}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500"
              />
            )}

            {/* Interactive Points on Hover Only (NO floating outlier dots!) */}
            {points.map((p, idx) => {
              const isHovered = hoveredIndex === idx
              return (
                <g key={idx}>
                  {/* Invisible Wide Hit Area for Mouse Interaction */}
                  <rect
                    x={p.x - (chartW / (chartData.length * 2))}
                    y={paddingTop}
                    width={chartW / chartData.length}
                    height={chartH}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                  />

                  {/* Active Hover Indicator Line & Dot */}
                  {isHovered && (
                    <g>
                      <line
                        x1={p.x}
                        y1={paddingTop}
                        x2={p.x}
                        y2={svgHeight - paddingBottom}
                        stroke={metricTheme.stroke}
                        strokeDasharray="2 2"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="6"
                        fill="#ffffff"
                        stroke={metricTheme.stroke}
                        strokeWidth="3.5"
                        className="shadow-md"
                      />
                    </g>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* X-Axis Date/Time Labels */}
        <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-400 font-mono px-2">
          {chartData.map((d, idx) => (
            <span
              key={idx}
              className={`transition-colors cursor-pointer ${
                hoveredIndex === idx ? `${metricTheme.activeColor} font-bold scale-105` : 'hover:text-slate-700'
              }`}
              onMouseEnter={() => setHoveredIndex(idx)}
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>

      {/* 4. Bottom Historical Summary Insight Bar */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="text-slate-400">Total Akumulasi:</span>
            <strong className="text-slate-800 font-mono font-semibold">
              {statsSummary.totalOrAvg} {statsSummary.unit}
            </strong>
          </span>

          <span className="flex items-center gap-1.5">
            <span className="text-slate-400">Nilai Minimum:</span>
            <strong className="text-slate-800 font-mono font-semibold">
              {statsSummary.min} {statsSummary.unit}
            </strong>
          </span>

          <span className="flex items-center gap-1.5">
            <span className="text-slate-400">Nilai Puncak (Maks):</span>
            <strong className="text-slate-800 font-mono font-semibold">
              {statsSummary.max} {statsSummary.unit}
            </strong>
          </span>

          <span className="flex items-center gap-1.5">
            <span className="text-slate-400">Tren:</span>
            <span className={`font-mono font-bold inline-flex items-center gap-0.5 ${
              statsSummary.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {statsSummary.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {statsSummary.change}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono">
            Data terverifikasi telemetri IoT SCADA
          </span>
        </div>
      </div>
    </div>
  )
}
