import React, { useState, useRef, useEffect } from 'react'
import type { AreaRoom } from '../types/pump'
import {
  Gauge,
  Droplets,
  Zap,
  Power,
  Layers,
  Building2,
  Fan,
  ArrowRight,
  Thermometer,
  Plus,
  Activity,
  ChevronDown,
  Search,
  Check,
} from 'lucide-react'
import { PumpPerformanceCharts } from './PumpPerformanceCharts'
import { HistoricalPerformanceChart } from './HistoricalPerformanceChart'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from 'cn'

interface DashboardMonitoringViewProps {
  rooms: AreaRoom[]
  onToggleMotor: (pumpId: string) => void
  onOpenAddPump?: () => void
}

export const DashboardMonitoringView: React.FC<DashboardMonitoringViewProps> = ({
  rooms,
  onToggleMotor,
  onOpenAddPump,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [stationSearch, setStationSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Keep selectedRoomId valid if rooms change
  useEffect(() => {
    if (rooms.length > 0 && (!selectedRoomId || !rooms.some((r) => r.id === selectedRoomId))) {
      setSelectedRoomId(rooms[0].id)
    }
  }, [rooms, selectedRoomId])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const activeRoomIndex = rooms.findIndex((r) => r.id === selectedRoomId)
  const currentRoom: AreaRoom | undefined =
    activeRoomIndex !== -1 ? rooms[activeRoomIndex] : rooms[0]

  const hasTank = Boolean(
    currentRoom
      ? currentRoom.hasTank !== undefined
        ? currentRoom.hasTank
        : (currentRoom.tankLevel !== undefined &&
           currentRoom.tankLevel > 0 &&
           !currentRoom.name.toLowerCase().includes('booster') &&
           !currentRoom.name.toLowerCase().includes('transfer') &&
           !currentRoom.name.toLowerCase().includes('distribusi'))
      : true
  )

  // Global KPI Calculations
  const allPumps = rooms.flatMap((r) => r.pumps)
  const totalPumps = allPumps.length
  const runningPumps = allPumps.filter((p) => p.status === 'RUNNING').length
  const totalFlowRate = rooms.reduce((acc, r) => acc + r.flowRate, 0)
  const avgPressure =
    rooms.length > 0 ? (rooms.reduce((acc, r) => acc + r.pressure, 0) / rooms.length).toFixed(2) : '0.00'
  const totalPower = allPumps
    .reduce((acc, p) => acc + (p.status === 'RUNNING' ? p.metrics?.power_kw || 18.5 : 0), 0)
    .toFixed(1)

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* 1. Top 4 Live Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Pumps Running */}
        <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              PUMPS RUNNING
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Fan className={`w-4 h-4 ${runningPumps > 0 ? 'animate-spin [animation-duration:1.2s]' : ''}`} />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {runningPumps}
              </span>
              <span className="font-mono text-xs text-slate-400 font-semibold">
                / {totalPumps} UNITS
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {totalPumps > 0 ? `${Math.round((runningPumps / totalPumps) * 100)}% Running` : 'Standby'}
            </span>
            <span className="text-slate-400 font-mono text-[10px]">Duty / Standby</span>
          </div>
        </div>

        {/* Metric 2: Average Pressure */}
        <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              DISCHARGE PRESSURE
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#00799e]/10 text-[#00799e] flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {avgPressure}
              </span>
              <span className="font-mono text-xs text-slate-500 font-semibold uppercase">
                bar
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-[#00799e] font-medium flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Range 2.0 – 6.0
            </span>
            <span className="text-slate-400 font-mono text-[10px]">Transmitter Active</span>
          </div>
        </div>

        {/* Metric 3: Total Flow Rate */}
        <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              TOTAL FLOW RATE
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {totalFlowRate.toFixed(1)}
              </span>
              <span className="font-mono text-xs text-slate-500 font-semibold">
                m³/h
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-sky-700 font-medium truncate">
              Main Distribution
            </span>
            <span className="text-slate-400 font-mono text-[10px]">Mag Flow</span>
          </div>
        </div>

        {/* Metric 4: Power Consumption */}
        <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              TOTAL POWER LOAD
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {totalPower}
              </span>
              <span className="font-mono text-xs text-slate-500 font-semibold uppercase">
                kW
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-amber-700 font-medium">
              3-Phase 380V Load
            </span>
            <span className="text-slate-400 font-mono text-[10px]">50.0 Hz</span>
          </div>
        </div>
      </div>

      {/* 3. Station Schematic & Real-Time Visualization Module */}
      {currentRoom ? (
        <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-xs">
            {/* Control Bar: Station Popout Selector + Realtime Readouts */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-200 mb-6">
              {/* Station Identity & Popout Selector */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Building2 className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 m-0 tracking-tight">
                    {currentRoom.name}
                  </h3>
                  <p className="text-xs text-slate-500 m-0 font-normal">
                    {hasTank
                      ? 'Piping Schematic, Reservoir Tank & Motor Controls'
                      : 'In-Line Booster Manifold, Discharge Telemetry & Motor Controls'}
                  </p>
                </div>
              </div>

              {/* Station Selection Popout & Telemetry Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Professional Station Popout Selector */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-slate-300 hover:bg-slate-100/80 text-slate-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 text-[#00799e]" />
                    <span className="truncate max-w-[160px] sm:max-w-[200px]">
                      {currentRoom.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-normal">
                      ({currentRoom.pumps.length} pumps)
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
                        isDropdownOpen && "rotate-180 text-[#00799e]"
                      )}
                    />
                  </button>

                  {/* Popout Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in p-1.5">
                      <div className="p-2 border-b border-slate-100">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          Select Plant Station ({rooms.length})
                        </span>
                        {rooms.length > 3 && (
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Search station..."
                              value={stationSearch}
                              onChange={(e) => setStationSearch(e.target.value)}
                              className="w-full pl-8 pr-3 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00799e]"
                              autoFocus
                            />
                          </div>
                        )}
                      </div>

                      <div className="max-h-64 overflow-y-auto p-1 space-y-1">
                        {rooms
                          .filter(
                            (r) =>
                              r.name.toLowerCase().includes(stationSearch.toLowerCase()) ||
                              r.code.toLowerCase().includes(stationSearch.toLowerCase())
                          )
                          .map((r) => {
                            const isSelected = r.id === currentRoom.id
                            const roomHasTank = Boolean(
                              r.hasTank !== undefined
                                ? r.hasTank
                                : (r.tankLevel !== undefined &&
                                   r.tankLevel > 0 &&
                                   !r.name.toLowerCase().includes('booster') &&
                                   !r.name.toLowerCase().includes('transfer') &&
                                   !r.name.toLowerCase().includes('distribusi'))
                            )
                            const rRunning = r.pumps.filter((p) => p.status === 'RUNNING').length

                            return (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => {
                                  setSelectedRoomId(r.id)
                                  setIsDropdownOpen(false)
                                  setStationSearch('')
                                }}
                                className={cn(
                                  "w-full px-3 py-2 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer group",
                                  isSelected
                                    ? "bg-[#00799e]/10 text-[#00799e] font-semibold"
                                    : "text-slate-700 hover:bg-slate-50"
                                )}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                      {r.code}
                                    </span>
                                    <span className="truncate">{r.name}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                                    <span>{r.pumps.length} Pumps ({rRunning} Active)</span>
                                    <span>•</span>
                                    <span>{roomHasTank ? 'Storage Tank' : 'Direct Booster'}</span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-[#00799e] shrink-0" />
                                )}
                              </button>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Header Live Telemetry Badges */}
                <div className="px-3 py-1.5 rounded-xl bg-slate-50 flex items-center gap-2 text-xs font-mono">
                  <Gauge className="w-3.5 h-3.5 text-[#00799e]" />
                  <span className="text-slate-500">P:</span>
                  <strong className="text-slate-900">{currentRoom.pressure.toFixed(2)} bar</strong>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-slate-50 flex items-center gap-2 text-xs font-mono">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  <span className="text-slate-500">Q:</span>
                  <strong className="text-slate-900">{currentRoom.flowRate.toFixed(1)} m³/h</strong>
                </div>
              </div>
            </div>

            {/* Schematic Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* 1. RESERVOIR WATER TANK MODULE (Only rendered if station has a tank!) */}
              {hasTank && (
                <div className="lg:col-span-4 bg-slate-50/70 rounded-2xl p-5 flex flex-col justify-between min-h-[350px]">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-[#00799e]" />
                      <span className="font-bold text-xs text-slate-900 font-mono tracking-wide">
                        RESERVOIR TANK
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-100 text-cyan-900 border border-cyan-300">
                      {currentRoom.tankLevel?.toFixed(1) || 75.0}% LEVEL
                    </span>
                  </div>

                  {/* Animated Tank Visualizer */}
                  <div className="my-4 flex items-center justify-center">
                    <div className="relative w-44 h-52 rounded-2xl border-2 border-cyan-500/80 bg-white overflow-hidden shadow-inner flex flex-col justify-end">
                      {/* Glass subtle gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-50/60 via-transparent to-cyan-50/40 pointer-events-none z-20" />
                      <div className="absolute top-2 left-3 right-3 flex justify-between text-[10px] font-mono text-slate-500 z-20 font-bold">
                        <span>CAP: 5,000L</span>
                        <span>100%</span>
                      </div>

                      {/* Level graduation lines */}
                      <div className="absolute inset-y-0 right-2.5 flex flex-col justify-between text-[9px] font-mono text-slate-400 py-3.5 z-20 pointer-events-none font-semibold">
                        <span>— 75%</span>
                        <span>— 50%</span>
                        <span>— 25%</span>
                      </div>

                      {/* Rising Water Bubbles */}
                      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                        <div className="w-2 h-2 rounded-full bg-white/70 absolute left-8 bottom-4 animate-bubble-1" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/70 absolute left-20 bottom-2 animate-bubble-2" />
                        <div className="w-2.5 h-2.5 rounded-full bg-white/70 absolute left-28 bottom-6 animate-bubble-3" />
                      </div>

                      {/* Water Fill with Wave Animation */}
                      <div
                        className="w-full bg-gradient-to-t from-[#005a75] via-[#00799e] to-[#38bdf8] relative transition-all duration-700 overflow-hidden"
                        style={{ height: `${currentRoom.tankLevel || 75}%` }}
                      >
                        {/* Animated Top Wave Surface */}
                        <div className="absolute top-0 left-0 right-0 h-4 bg-cyan-200/50 animate-water-wave rounded-full transform -translate-y-2" />
                      </div>
                    </div>
                  </div>

                  {/* Tank Footer Info */}
                  <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span>Sensor: <strong className="text-slate-800 font-mono">{currentRoom.sensorTag || 'LT-01'}</strong></span>
                    <span className="text-emerald-700 font-bold font-mono text-[10px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Normal Level
                    </span>
                  </div>
                </div>
              )}

              {/* 2. PUMPS GRID (Takes full 12 cols if no tank!) */}
              <div className={cn(
                hasTank ? "lg:col-span-8" : "lg:col-span-12",
                "flex flex-col justify-between gap-4"
              )}>
                {currentRoom.pumps.length === 0 ? (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
                    <div className="w-12 h-12 rounded-2xl bg-[#00799e]/10 text-[#00799e] flex items-center justify-center mb-3">
                      <Layers className="w-6 h-6" />
                    </div>
                    <h4 className="font-heading font-bold text-base text-slate-900 mb-1">
                      No Pumps Assigned to This Station
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mb-4 font-normal">
                      Configure or assign pumps to {currentRoom.name} to monitor performance.
                    </p>
                    {onOpenAddPump && (
                      <button
                        onClick={onOpenAddPump}
                        className="px-4 py-2 rounded-xl bg-[#00799e] hover:bg-[#006887] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Pump</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={cn(
                    "grid gap-4",
                    hasTank
                      ? "grid-cols-1 md:grid-cols-2"
                      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  )}>
                    {currentRoom.pumps.map((pump, pIdx) => {
                      const isRunning = pump.status === 'RUNNING'
                      const motorIdx = (pIdx % 2) as 0 | 1

                      return (
                        <div
                          key={pump.id}
                          className={cn(
                            "rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden bg-white shadow-xs",
                            isRunning && "ring-2 ring-emerald-500/25 bg-gradient-to-b from-emerald-500/[0.03] to-white"
                          )}
                        >
                          <div>
                            {/* Card Header: Tag & Running Indicator */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-lg font-mono font-bold text-xs bg-slate-900 text-white">
                                  {pump.code}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "font-mono font-bold text-[10px] px-2 py-0.5 border-0 inline-flex items-center gap-1.5",
                                    isRunning
                                      ? "bg-emerald-50 text-emerald-700"
                                      : pump.status === 'FAULT'
                                      ? "bg-rose-50 text-rose-700"
                                      : "bg-slate-100 text-slate-700"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      isRunning
                                        ? "bg-emerald-500 led-pulse-emerald"
                                        : pump.status === 'FAULT'
                                        ? "bg-rose-500 led-pulse-rose"
                                        : "bg-slate-400"
                                    )}
                                  />
                                  {pump.status}
                                </Badge>
                              </div>

                              <span className="text-[11px] font-mono text-slate-400 font-semibold">
                                MTR-{motorIdx + 1}
                              </span>
                            </div>

                            {/* Pump Name */}
                            <h4 className="font-heading font-bold text-sm text-slate-900 mb-3 truncate" title={pump.name}>
                              {pump.name}
                            </h4>

                            {/* Turbine / Impeller Visual Chamber */}
                            <div className="p-3.5 rounded-xl bg-slate-50 mb-3.5 flex items-center justify-between shadow-2xs">
                              <div className="flex items-center gap-3">
                                {/* Rotating Impeller Turbine */}
                                <div
                                  className={cn(
                                    "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500",
                                    isRunning
                                      ? "bg-[#00799e] text-white shadow-sm shadow-[#00799e]/30"
                                      : "bg-slate-200 text-slate-400"
                                  )}
                                >
                                  <Fan
                                    className={cn(
                                      "w-6 h-6",
                                      isRunning ? "animate-spin [animation-duration:0.8s]" : ""
                                    )}
                                  />
                                </div>

                                <div>
                                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                                    MOTOR SPEED
                                  </span>
                                  <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 block">
                                    {isRunning ? '1,450 RPM' : '0 RPM'}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    FREQ: {isRunning ? '50.0 Hz' : '0.0 Hz'}
                                  </span>
                                </div>
                              </div>

                              {/* Mini Status Indicator */}
                              {isRunning ? (
                                <Badge variant="outline" className="flex items-center gap-1 text-emerald-700 font-mono text-xs font-bold px-2.5 py-1 bg-emerald-50 border-0">
                                  <span>ONLINE</span>
                                  <ArrowRight className="w-3 h-3 animate-pulse" />
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-slate-500 font-mono px-2.5 py-1 bg-slate-100 border-0">
                                  STANDBY
                                </Badge>
                              )}
                            </div>

                            {/* Telemetry Metrics 4-Grid with Monospace Readouts */}
                            <div className="grid grid-cols-2 gap-2 text-xs mb-3 font-mono">
                              <div className="p-2.5 rounded-xl bg-slate-50 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-[#00799e]/10 text-[#00799e] flex items-center justify-center shrink-0">
                                  <Gauge className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block text-[10px] text-slate-400 font-sans font-medium leading-none">Pressure</span>
                                  <span className="font-bold text-slate-900 text-xs truncate block mt-0.5">
                                    {pump.metrics?.pressure_bar ? pump.metrics.pressure_bar.toFixed(2) : '0.00'} bar
                                  </span>
                                </div>
                              </div>

                              <div className="p-2.5 rounded-xl bg-slate-50 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                                  <Droplets className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block text-[10px] text-slate-400 font-sans font-medium leading-none">Flow Rate</span>
                                  <span className="font-bold text-slate-900 text-xs truncate block mt-0.5">
                                    {pump.metrics?.flow_m3h ? pump.metrics.flow_m3h.toFixed(1) : '0.0'} m³/h
                                  </span>
                                </div>
                              </div>

                              <div className="p-2.5 rounded-xl bg-slate-50 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                  <Zap className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block text-[10px] text-slate-400 font-sans font-medium leading-none">Power</span>
                                  <span className="font-bold text-slate-900 text-xs truncate block mt-0.5">
                                    {pump.metrics?.power_kw ? pump.metrics.power_kw.toFixed(1) : '0.0'} kW
                                  </span>
                                </div>
                              </div>

                              <div className="p-2.5 rounded-xl bg-slate-50 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                  <Thermometer className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block text-[10px] text-slate-400 font-sans font-medium leading-none">Temp</span>
                                  <span className="font-bold text-slate-900 text-xs truncate block mt-0.5">
                                    {pump.metrics?.motor_temp_c ? pump.metrics.motor_temp_c.toFixed(1) : '25.0'} °C
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Interactive Switch Control with Tactile Styling */}
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 font-mono">
                              <Power
                                className={cn("w-3.5 h-3.5", isRunning ? 'text-emerald-600' : 'text-slate-400')}
                              />
                              MOTOR CONTROL
                            </span>

                            <div className="flex items-center gap-2">
                              <span className={cn("text-[10px] font-mono font-semibold", isRunning ? "text-emerald-600" : "text-slate-400")}>
                                {isRunning ? "ACTIVE" : "STANDBY"}
                              </span>
                              <Switch
                                checked={isRunning}
                                onCheckedChange={() => onToggleMotor(pump.id)}
                                aria-label={`Toggle motor ${pump.name}`}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
      ) : null}

      {/* 4. Real-Time Telemetry Line Chart & Pump Load Bar Chart */}
      {currentRoom && (
        <PumpPerformanceCharts currentRoom={currentRoom} allRooms={rooms} />
      )}

      {/* 5. Historical Performance Analytics Line Chart */}
      <HistoricalPerformanceChart currentRoom={currentRoom} allRooms={rooms} />
    </div>
  )
}
