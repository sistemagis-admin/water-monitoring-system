import React, { useState, useEffect, useMemo } from 'react'
import type { AreaRoom, PumpAsset, AlarmItem, DeviceGateway, SimulationStats } from '../types/pump'
import {
  Gauge,
  Droplets,
  Zap,
  Power,
  Layers,
  Building2,
  Fan,
  Thermometer,
  Plus,
  Search,
  Radio,
  LayoutGrid,
  EyeOff,
  AlertTriangle,
  Server,
  Wifi,
  ShieldCheck,
  LineChart,
  List,
  Eye,
} from 'lucide-react'
import { PumpPerformanceCharts } from './PumpPerformanceCharts'
import { HistoricalPerformanceChart } from './HistoricalPerformanceChart'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from '@/components/ui/select'
import { cn } from 'cn'

interface DashboardMonitoringViewProps {
  rooms: AreaRoom[]
  onToggleMotor: (pumpId: string) => void
  onOpenAddPump?: () => void
  lastUpdated?: string
  isBackendOnline?: boolean
  alarms?: AlarmItem[]
  gateways?: DeviceGateway[]
  stats?: SimulationStats
}

interface EnrichedPump extends PumpAsset {
  roomId: string
  roomName: string
  roomCode: string
}

export const DashboardMonitoringView: React.FC<DashboardMonitoringViewProps> = ({
  rooms,
  onToggleMotor,
  onOpenAddPump,
  lastUpdated,
  isBackendOnline = true,
  alarms = [],
  gateways = [],
  stats: _stats,
}) => {
  // Fleet View Controls
  const [fleetStatusFilter, setFleetStatusFilter] = useState<'ALL' | 'RUNNING' | 'STOPPED' | 'FAULT'>('ALL')
  const [fleetLocationFilter, setFleetLocationFilter] = useState<string>('ALL')
  const [fleetSearchQuery, setFleetSearchQuery] = useState('')
  const [fleetViewMode, setFleetViewMode] = useState<'grid' | 'table'>('grid')

  // Station Detail Schematic Controls (Default true so tank visualization is readily accessible)
  const [showStationSchematic, setShowStationSchematic] = useState(true)
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '')

  // Keep selectedRoomId valid if rooms change
  useEffect(() => {
    if (rooms.length > 0 && (!selectedRoomId || !rooms.some((r) => r.id === selectedRoomId))) {
      setSelectedRoomId(rooms[0].id)
    }
  }, [rooms, selectedRoomId])

  // All pumps across all rooms (Flattened Fleet data)
  const allEnrichedPumps = useMemo<EnrichedPump[]>(() => {
    return rooms.flatMap((r) =>
      r.pumps.map((p) => ({
        ...p,
        roomId: r.id,
        roomName: r.name,
        roomCode: r.code,
      }))
    )
  }, [rooms])

  // Filtered pumps based on status, location, and search
  const filteredPumps = useMemo(() => {
    return allEnrichedPumps.filter((pump) => {
      if (fleetStatusFilter !== 'ALL' && pump.status !== fleetStatusFilter) return false
      if (fleetLocationFilter !== 'ALL' && pump.roomId !== fleetLocationFilter) return false
      if (fleetSearchQuery.trim()) {
        const query = fleetSearchQuery.toLowerCase()
        return (
          pump.code.toLowerCase().includes(query) ||
          pump.name.toLowerCase().includes(query) ||
          pump.roomName.toLowerCase().includes(query) ||
          pump.roomCode.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [allEnrichedPumps, fleetStatusFilter, fleetLocationFilter, fleetSearchQuery])

  // Station Schematic Active Room
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

  // Calculations for Overview Cards
  const totalPumps = allEnrichedPumps.length
  const runningPumps = allEnrichedPumps.filter((p) => p.status === 'RUNNING').length
  const stoppedPumps = allEnrichedPumps.filter((p) => p.status === 'STOPPED').length
  const faultPumps = allEnrichedPumps.filter((p) => p.status === 'FAULT').length

  const totalFlowRate = rooms.reduce((acc, r) => acc + r.flowRate, 0)
  const avgPressure =
    rooms.length > 0 ? (rooms.reduce((acc, r) => acc + r.pressure, 0) / rooms.length).toFixed(2) : '0.00'
  const avgFlowRate =
    rooms.length > 0 ? (totalFlowRate / rooms.length).toFixed(1) : '0.0'
  const totalPower = allEnrichedPumps
    .reduce((acc, p) => acc + (p.status === 'RUNNING' ? p.metrics?.power_kw || 18.5 : 0), 0)
    .toFixed(1)

  const displayLastUpdated = lastUpdated || 'Terhubung'
  
  // Recent Anomalies (Active Alarms)
  const activeAnomalies = useMemo(() => {
    return alarms.filter(a => a.status === 'OPEN').sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }, [alarms]);

  // Derived Performance Statistics
  const gatewayOnlineCount = gateways.filter(g => g.status === 'ONLINE').length;
  const avgRssi = gateways.length > 0 ? (gateways.reduce((acc, g) => acc + g.rssi, 0) / gateways.length).toFixed(0) : '-65';
  
  // Specific Energy Consumption (SEC) estimation (kWh per m3)
  const sec = totalFlowRate > 0 ? (Number(totalPower) / totalFlowRate).toFixed(2) : '0.00';
  
  // Equipment Health Score
  const healthScore = totalPumps > 0 ? (((totalPumps - faultPumps) / totalPumps) * 100).toFixed(1) : '100.0';
  
  // Alarm / Error Rate (Last 24h mock or based on open alarms)
  const faultRate = totalPumps > 0 ? ((faultPumps / totalPumps) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* ========================================================================= */}
      {/* 1. TOP OVERVIEW CARDS                                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Lokasi Terpantau */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              LOKASI TERPANTAU
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-slate-700" />
            </div>
          </div>

          <div className="my-2.5">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {rooms.length}
              </span>
              <span className="font-mono text-xs text-slate-500 font-semibold uppercase">
                Stasiun
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              {totalPumps} Pompa Terpasang
            </p>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-700 font-medium flex items-center gap-1.5 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Semua Stasiun Terhubung
            </span>
            <span className="text-slate-400 font-mono text-[10px]">Plant Network</span>
          </div>
        </div>

        {/* Card 2: Rata-Rata Tekanan */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              RATA-RATA TEKANAN
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-[#00799e] flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {avgPressure}
              </span>
              <span className="font-mono text-xs text-slate-500 font-semibold uppercase">
                bar
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              Rentang Kerja: 2.0 – 6.0 bar
            </p>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-700 font-medium font-mono text-[11px]">
              Manifold Discharge Aktif
            </span>
            <span className="text-slate-400 font-mono text-[10px]">Transmitter</span>
          </div>
        </div>

        {/* Card 3: Total Debit Air */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              TOTAL DEBIT AIR
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {totalFlowRate.toFixed(1)}
              </span>
              <span className="font-mono text-xs text-slate-500 font-semibold">
                m³/h
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              Rata-rata: {avgFlowRate} m³/h / stasiun
            </p>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-700 font-medium font-mono text-[11px] truncate">
              Distribusi Utama Aktif
            </span>
            <span className="text-slate-400 font-mono text-[10px]">Mag Flow</span>
          </div>
        </div>

        {/* Card 4: Pembaruan Terakhir dengan Icon Live Ticker Saja */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              PEMBARUAN TERAKHIR
            </span>
            {/* Live Ticker Icon Badge (Hanya icon live saja, rapi & profesional) */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-mono font-bold">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>

          <div className="my-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {displayLastUpdated}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              {runningPumps}/{totalPumps} Pompa Aktif • {totalPower} kW Beban
            </p>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-700 font-medium flex items-center gap-1.5 font-mono text-[11px]">
            <span className={`w-2 h-2 rounded-full ${isBackendOnline ? "bg-emerald-500" : "bg-amber-500"}`} />
              {isBackendOnline ? 'Gateway Sinkron' : 'Mode Offline'}
            </span>
            <span className="text-slate-400 font-mono text-[10px]">Telemetry Node</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1.2. SYSTEM PERFORMANCE & RELIABILITY CARDS (NEW)                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card A: Ketersediaan Jaringan (Network Uptime) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              KONEKTIVITAS EDGE
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-extrabold text-slate-900 tracking-tight">
                {gatewayOnlineCount}/{gateways.length || 1}
              </span>
              <span className="font-mono text-xs text-slate-500 font-semibold">Online</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-1 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-slate-400" />
              Sinyal Rata-rata: {avgRssi} dBm
            </p>
          </div>
        </div>

        {/* Card B: OEE / Kesehatan Aset */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              KESEHATAN ASET (OEE)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-extrabold text-emerald-600 tracking-tight">
                {healthScore}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              {faultPumps === 0 ? 'Semua unit beroperasi normal' : `${faultPumps} unit memerlukan perbaikan`}
            </p>
          </div>
        </div>

        {/* Card C: Efisiensi Energi (SEC) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              EFISIENSI ENERGI (SEC)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-extrabold text-slate-900 tracking-tight">
                {sec}
              </span>
              <span className="font-mono text-xs text-slate-500 font-semibold">kWh/m³</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              Rasio konsumsi daya per kubik air
            </p>
          </div>
        </div>

        {/* Card D: Tingkat Error / Fault Rate */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              TINGKAT GANGGUAN
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <LineChart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-extrabold text-slate-900 tracking-tight">
                {faultRate}%
              </span>
              <span className="font-mono text-xs text-slate-500 font-semibold">Fault Rate</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              {activeAnomalies.length} Anomali aktif di sistem
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1.5. ANOMALY TICKER & RECENT INSIGHTS (NEW)                               */}
      {/* ========================================================================= */}
      {activeAnomalies.length > 0 && (
        <div className="bg-rose-50/50 rounded-2xl p-4 shadow-xs border border-rose-200/60 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-rose-200/50 animate-ping opacity-25"></div>
              <AlertTriangle className="w-5 h-5 relative z-10" />
            </div>
            <div>
              <h4 className="font-heading font-extrabold text-sm text-rose-900 m-0">Anomali Terdeteksi</h4>
              <p className="text-[11px] text-rose-700/80 font-mono mt-0.5">{activeAnomalies.length} Sistem Membutuhkan Perhatian</p>
            </div>
          </div>
          
          <div className="flex-1 flex gap-3 overflow-x-auto pb-2 md:pb-0 hide-scrollbar snap-x">
            {activeAnomalies.slice(0, 3).map(anomaly => (
              <div key={anomaly.id} className="min-w-[260px] max-w-[320px] bg-white rounded-xl p-3 border border-rose-100 shadow-sm shrink-0 snap-start flex flex-col justify-between">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-900 text-white shrink-0">
                      {anomaly.code}
                    </span>
                    <span className="text-[10px] font-bold text-slate-800 truncate" title={anomaly.assetName}>
                      {anomaly.assetName}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap">
                    {new Date(anomaly.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug line-clamp-2" title={anomaly.message}>
                  {anomaly.message}
                </p>
              </div>
            ))}
            {activeAnomalies.length > 3 && (
              <div className="min-w-[120px] flex items-center justify-center p-3 shrink-0">
                <span className="text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer transition-colors">
                  +{activeAnomalies.length - 3} lainnya...
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CARD PEMANTAUAN SELURUH POMPA (HEADER TER-JUSTIFY RAPI KIRI & KANAN)   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80">
        {/* Header & Controls Toolbar: Justify-Between Kiri & Kanan Sepenuhnya */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 mb-5 w-full">
          {/* Sisi Kiri: Judul, Subtitle, & Badge Total Unit */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <Layers className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 m-0 tracking-tight">
                  Pemantauan Seluruh Pompa
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {totalPumps} Unit di {rooms.length} Stasiun
                </span>
              </div>
              <p className="text-xs text-slate-500 m-0 font-normal mt-0.5">
                Status operasional dan telemetri seluruh unit pompa lintas stasiun secara serentak
              </p>
            </div>
          </div>

          {/* Sisi Kanan: Action Toolbar terdorong rapi ke kanan */}
          <div className="flex flex-wrap items-center gap-2.5 md:justify-end">
            {/* Status Filter Badges */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-xs">
              <button
                type="button"
                onClick={() => setFleetStatusFilter('ALL')}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer",
                  fleetStatusFilter === 'ALL'
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Semua ({totalPumps})
              </button>
              <button
                type="button"
                onClick={() => setFleetStatusFilter('RUNNING')}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                  fleetStatusFilter === 'RUNNING'
                    ? "bg-white text-emerald-800 shadow-2xs"
                    : "text-slate-600 hover:text-emerald-800"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Aktif ({runningPumps})
              </button>
              <button
                type="button"
                onClick={() => setFleetStatusFilter('STOPPED')}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                  fleetStatusFilter === 'STOPPED'
                    ? "bg-white text-slate-800 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Standby ({stoppedPumps})
              </button>
              {faultPumps > 0 && (
                <button
                  type="button"
                  onClick={() => setFleetStatusFilter('FAULT')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                    fleetStatusFilter === 'FAULT'
                      ? "bg-rose-50 text-rose-800 shadow-2xs"
                      : "text-rose-600 hover:text-rose-800"
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Gangguan ({faultPumps})
                </button>
              )}
            </div>

            {/* Location Filter Dropdown with shadcn Select */}
            <Select value={fleetLocationFilter} onValueChange={setFleetLocationFilter}>
              <SelectTrigger className="h-8 min-w-[170px] sm:min-w-[195px] text-xs font-medium rounded-xl bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300 shadow-2xs">
                <SelectValue placeholder="Pilih Stasiun" />
              </SelectTrigger>
              <SelectContent position="popper" align="start" className="bg-white border-slate-200 rounded-xl shadow-lg z-50">
                <SelectGroup>
                  <SelectItem value="ALL" className="text-xs py-1.5 cursor-pointer">
                    Semua Stasiun ({rooms.length})
                  </SelectItem>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id} className="text-xs py-1.5 cursor-pointer">
                      <span className="font-mono text-slate-500 mr-1.5">{r.code}</span>
                      <span>{r.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 ml-1">({r.pumps.length})</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari kode/nama..."
                value={fleetSearchQuery}
                onChange={(e) => setFleetSearchQuery(e.target.value)}
                className="w-36 sm:w-44 pl-8 pr-2.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00799e]"
              />
            </div>

            {/* Grid / Table View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setFleetViewMode('grid')}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  fleetViewMode === 'grid'
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
                title="Tampilan Grid Padat"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setFleetViewMode('table')}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  fleetViewMode === 'table'
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
                title="Tampilan Tabel Pompa"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Fleet Pumps Display */}
        {filteredPumps.length === 0 ? (
          <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
            <Layers className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada unit pompa yang cocok</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Sesuaikan kata kunci pencarian atau filter lokasi stasiun.
            </p>
            {(fleetStatusFilter !== 'ALL' || fleetLocationFilter !== 'ALL' || fleetSearchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setFleetStatusFilter('ALL')
                  setFleetLocationFilter('ALL')
                  setFleetSearchQuery('')
                }}
                className="mt-3 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold cursor-pointer transition-all"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : fleetViewMode === 'grid' ? (
          /* ========================================================= */
          /* GRID VIEW: Visual Turbin Berputar yang Jelas & Terlihat   */
          /* ========================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredPumps.map((pump) => {
              const isRunning = pump.status === 'RUNNING'
              const isFault = pump.status === 'FAULT'

              return (
                <div
                  key={pump.id}
                  className={cn(
                    "rounded-2xl p-4 transition-colors flex flex-col justify-between relative bg-white border shadow-2xs",
                    isRunning
                      ? "border-emerald-300/80 bg-gradient-to-b from-emerald-50/[0.15] to-white ring-1 ring-emerald-500/20"
                      : isFault
                      ? "border-rose-300/80 bg-rose-50/[0.12] ring-1 ring-rose-500/20"
                      : "border-slate-200/90"
                  )}
                >
                  <div>
                    {/* Header Row: Location Tag, Pump Code, Status Badge */}
                    <div className="flex items-center justify-between gap-1.5 mb-2.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white shrink-0">
                          {pump.code}
                        </span>
                        <span
                          className="text-[10px] font-mono text-slate-600 font-semibold truncate bg-slate-100 px-1.5 py-0.5 rounded"
                          title={pump.roomName}
                        >
                          {pump.roomCode}
                        </span>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono font-bold text-[10px] px-2 py-0.5 border-0 inline-flex items-center gap-1.5 shrink-0",
                          isRunning
                            ? "bg-emerald-100 text-emerald-800"
                            : isFault
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-700"
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isRunning
                              ? "bg-emerald-600"
                              : isFault
                              ? "bg-rose-600"
                              : "bg-slate-400"
                          )}
                        />
                        {isRunning ? 'AKTIF' : isFault ? 'FAULT' : 'STANDBY'}
                      </Badge>
                    </div>

                    {/* Pump Name & Location Name */}
                    <div className="mb-2.5">
                      <h4
                        className="font-heading font-bold text-sm text-slate-900 truncate m-0"
                        title={pump.name}
                      >
                        {pump.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-normal truncate m-0 mt-0.5">
                        {pump.roomName}
                      </p>
                    </div>

                    {/* Visual Animasi Turbin: Memudahkan Inspeksi Seketika */}
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            isRunning
                              ? "bg-[#00799e] text-white shadow-xs shadow-[#00799e]/20"
                              : "bg-slate-200 text-slate-400"
                          )}
                        >
                          <Fan
                            className={cn(
                              "w-4 h-4",
                              isRunning ? "animate-spin [animation-duration:1.1s]" : ""
                            )}
                          />
                        </div>

                        <div>
                          <span className="block text-[9px] text-slate-400 uppercase font-mono font-bold leading-none">
                            Putaran Motor
                          </span>
                          <span className="font-mono font-bold text-xs text-slate-900 block mt-0.5">
                            {isRunning ? '1,450 RPM' : '0 RPM'}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200/80">
                        {isRunning ? '50.0 Hz' : '0.0 Hz'}
                      </span>
                    </div>

                    {/* 4 Telemetry Metrics Grid (Tekanan, Debit, Daya, Suhu) */}
                    <div className="grid grid-cols-2 gap-1.5 text-xs mb-3 font-mono">
                      {/* Pressure */}
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
                        <Gauge className="w-3.5 h-3.5 text-[#00799e] shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-[9px] text-slate-400 font-sans leading-none">
                            Tekanan
                          </span>
                          <span className="font-bold text-slate-900 text-xs truncate block mt-0.5">
                            {pump.metrics?.pressure_bar ? pump.metrics.pressure_bar.toFixed(2) : '0.00'} <span className="text-[9px] font-normal text-slate-500">bar</span>
                          </span>
                        </div>
                      </div>

                      {/* Flow Rate */}
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
                        <Droplets className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-[9px] text-slate-400 font-sans leading-none">
                            Debit
                          </span>
                          <span className="font-bold text-slate-900 text-xs truncate block mt-0.5">
                            {pump.metrics?.flow_m3h ? pump.metrics.flow_m3h.toFixed(1) : '0.0'} <span className="text-[9px] font-normal text-slate-500">m³/h</span>
                          </span>
                        </div>
                      </div>

                      {/* Power */}
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-[9px] text-slate-400 font-sans leading-none">
                            Daya
                          </span>
                          <span className="font-bold text-slate-900 text-xs truncate block mt-0.5">
                            {pump.metrics?.power_kw ? pump.metrics.power_kw.toFixed(1) : '0.0'} <span className="text-[9px] font-normal text-slate-500">kW</span>
                          </span>
                        </div>
                      </div>

                      {/* Temperature */}
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
                        <Thermometer className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-[9px] text-slate-400 font-sans leading-none">
                            Suhu
                          </span>
                          <span className="font-bold text-slate-900 text-xs truncate block mt-0.5">
                            {pump.metrics?.motor_temp_c ? pump.metrics.motor_temp_c.toFixed(1) : '25.0'} <span className="text-[9px] font-normal text-slate-500">°C</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Motor Control Switch with Clear Label */}
                  <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 font-mono">
                      <Power
                        className={cn(
                          "w-3.5 h-3.5",
                          isRunning ? "text-emerald-600" : "text-slate-400"
                        )}
                      />
                      KONTROL MOTOR
                    </span>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[10px] font-mono font-bold",
                          isRunning ? "text-emerald-700" : "text-slate-400"
                        )}
                      >
                        {isRunning ? "ON" : "OFF"}
                      </span>
                      <Switch
                        checked={isRunning}
                        onCheckedChange={() => onToggleMotor(pump.id)}
                        aria-label={`Sakelar motor ${pump.name}`}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* ========================================================= */
          /* TABLE VIEW: Padat, High-Density Fleet List                */
          /* ========================================================= */
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Kode Pompa</th>
                  <th className="py-2.5 px-3">Nama Pompa</th>
                  <th className="py-2.5 px-3">Lokasi / Stasiun</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Tekanan</th>
                  <th className="py-2.5 px-3">Debit Air</th>
                  <th className="py-2.5 px-3">Daya Listrik</th>
                  <th className="py-2.5 px-3">Suhu Motor</th>
                  <th className="py-2.5 px-3 text-right">Kontrol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPumps.map((pump) => {
                  const isRunning = pump.status === 'RUNNING'
                  const isFault = pump.status === 'FAULT'

                  return (
                    <tr
                      key={pump.id}
                      className={cn(
                        "hover:bg-slate-50 transition-colors",
                        isRunning && "bg-emerald-50/[0.15]"
                      )}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px]">
                          {pump.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 font-sans">
                        {pump.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-sans text-xs">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 mr-1.5">
                          {pump.roomCode}
                        </span>
                        {pump.roomName}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono font-bold text-[10px] px-2 py-0.5 border-0 inline-flex items-center gap-1.5",
                            isRunning
                              ? "bg-emerald-100 text-emerald-800"
                              : isFault
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 text-slate-700"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isRunning
                                ? "bg-emerald-600"
                                : isFault
                                ? "bg-rose-600"
                                : "bg-slate-400"
                            )}
                          />
                          {isRunning ? 'AKTIF' : isFault ? 'FAULT' : 'STANDBY'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {pump.metrics?.pressure_bar ? pump.metrics.pressure_bar.toFixed(2) : '0.00'} bar
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-sky-700">
                        {pump.metrics?.flow_m3h ? pump.metrics.flow_m3h.toFixed(1) : '0.0'} m³/h
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-amber-700">
                        {pump.metrics?.power_kw ? pump.metrics.power_kw.toFixed(1) : '0.0'} kW
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-rose-700">
                        {pump.metrics?.motor_temp_c ? pump.metrics.motor_temp_c.toFixed(1) : '25.0'} °C
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Switch
                            checked={isRunning}
                            onCheckedChange={() => onToggleMotor(pump.id)}
                            aria-label={`Toggle ${pump.name}`}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. DETAIL SKEMATIK & VISUALISASI TANGKI AIR RESERVOIR                    */}
      {/* ========================================================================= */}
      {currentRoom && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80">
          {/* Header Bar with Toggle and Station Popout Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
            {/* Station Identity */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-extrabold text-base text-slate-900 m-0 tracking-tight">
                    Skematik Detail Stasiun: {currentRoom.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowStationSchematic((prev) => !prev)}
                    className="text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 font-mono transition-colors cursor-pointer ml-1"
                  >
                    {showStationSchematic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showStationSchematic ? 'Sembunyikan' : 'Tampilkan'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 m-0 font-normal">
                  {hasTank
                    ? 'Visualisasi Tangki Reservoir Ringan & Pemipaan Stasiun'
                    : 'Manifold Booster & Telemetri Stasiun'}
                </p>
              </div>
            </div>

            {/* Station Selector Popout & Quick Telemetry Readouts */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Station Popout Selector with shadcn Select */}
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger className="h-9 min-w-[200px] sm:min-w-[240px] rounded-xl bg-slate-50 border-slate-200 text-slate-800 text-xs font-semibold hover:bg-slate-100 shadow-2xs">
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="size-3.5 text-[#00799e] shrink-0" />
                    <span className="truncate">{currentRoom.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 font-normal">
                      ({currentRoom.pumps.length} pompa)
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent position="popper" align="end" className="w-[280px] sm:w-[320px] bg-white border-slate-200 rounded-2xl shadow-xl p-1 z-50 max-h-72 overflow-y-auto">
                  <SelectGroup>
                    <SelectLabel className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2.5 py-1">
                      Pilih Stasiun Terpantau ({rooms.length})
                    </SelectLabel>
                    {rooms.map((r) => {
                      const rRunning = r.pumps.filter((p) => p.status === 'RUNNING').length
                      const roomHasTank = Boolean(
                        r.hasTank !== undefined
                          ? r.hasTank
                          : (r.tankLevel !== undefined &&
                             r.tankLevel > 0 &&
                             !r.name.toLowerCase().includes('booster') &&
                             !r.name.toLowerCase().includes('transfer') &&
                             !r.name.toLowerCase().includes('distribusi'))
                      )

                      return (
                        <SelectItem key={r.id} value={r.id} className="text-xs rounded-xl py-2 px-2.5 cursor-pointer hover:bg-slate-100 focus:bg-[#00799e]/10 focus:text-[#00799e]">
                          <div className="flex flex-col gap-0.5 text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                {r.code}
                              </span>
                              <span className="font-semibold text-slate-900">{r.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                              <span>{r.pumps.length} Pompa ({rRunning} Aktif)</span>
                              <span>•</span>
                              <span>{roomHasTank ? 'Tangki Air' : 'In-Line Booster'}</span>
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>

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

          {/* Schematic Content Body */}
          {showStationSchematic && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mt-5">
              {/* 1. RESERVOIR WATER TANK DENGAN ANIMASI AIR RINGAN (GPU-accelerated pure CSS) */}
              {hasTank && (
                <div className="lg:col-span-4 bg-slate-50/70 rounded-2xl p-5 flex flex-col justify-between min-h-[320px] border border-slate-200/60">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-[#00799e]" />
                      <span className="font-bold text-xs text-slate-900 font-mono tracking-wide">
                        TANGKI RESERVOIR
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-100 text-cyan-900 border border-cyan-300">
                      {currentRoom.tankLevel?.toFixed(1) || 75.0}% LEVEL
                    </span>
                  </div>

                  {/* Level Indicator dengan Animasi Permukaan Air Ringan (GPU Composited) */}
                  <div className="my-4 flex items-center justify-center">
                    <div className="relative w-40 h-48 rounded-xl border-2 border-cyan-600/70 bg-white overflow-hidden shadow-inner flex flex-col justify-end">
                      <div className="absolute top-2 left-3 right-3 flex justify-between text-[10px] font-mono text-slate-600 z-20 font-bold">
                        <span>5,000L</span>
                        <span>100%</span>
                      </div>

                      {/* Level graduation lines */}
                      <div className="absolute inset-y-0 right-2.5 flex flex-col justify-between text-[9px] font-mono text-slate-400 py-3.5 z-20 pointer-events-none font-semibold">
                        <span>— 75%</span>
                        <span>— 50%</span>
                        <span>— 25%</span>
                      </div>

                      {/* Rising Bubbles Ringan (2 Partikel Ringan CSS) */}
                      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/70 absolute left-8 bottom-3 animate-bubble-1" />
                        <div className="w-2 h-2 rounded-full bg-white/70 absolute left-24 bottom-5 animate-bubble-2" />
                      </div>

                      {/* Calm Water Fill with Wave Animation Surface */}
                      <div
                        className="w-full bg-gradient-to-t from-[#005a75] via-[#00799e] to-[#38bdf8] relative transition-all duration-700 overflow-hidden"
                        style={{ height: `${currentRoom.tankLevel || 75}%` }}
                      >
                        {/* Pure CSS Surface Wave Animation */}
                        <div className="absolute top-0 left-0 right-0 h-3 bg-cyan-200/50 animate-water-wave rounded-full transform -translate-y-1.5" />
                      </div>
                    </div>
                  </div>

                  {/* Tank Footer Info */}
                  <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-200 flex items-center justify-between font-mono">
                    <span>Sensor: <strong className="text-slate-800">{currentRoom.sensorTag || 'LT-01'}</strong></span>
                    <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Level Normal
                    </span>
                  </div>
                </div>
              )}

              {/* 2. PUMPS GRID FOR THIS ROOM */}
              <div className={cn(
                hasTank ? "lg:col-span-8" : "lg:col-span-12",
                "flex flex-col justify-between gap-4"
              )}>
                {currentRoom.pumps.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Layers className="w-8 h-8 text-slate-400 mb-2" />
                    <h4 className="font-heading font-bold text-sm text-slate-900 mb-1">
                      Belum Ada Pompa di Stasiun Ini
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mb-4 font-normal">
                      Tambahkan unit pompa ke {currentRoom.name} untuk memantau performa.
                    </p>
                    {onOpenAddPump && (
                      <button
                        onClick={onOpenAddPump}
                        className="px-3.5 py-1.5 rounded-xl bg-[#00799e] hover:bg-[#006887] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Pompa</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={cn(
                    "grid gap-3.5",
                    hasTank
                      ? "grid-cols-1 md:grid-cols-2"
                      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  )}>
                    {currentRoom.pumps.map((pump) => {
                      const isRunning = pump.status === 'RUNNING'

                      return (
                        <div
                          key={pump.id}
                          className={cn(
                            "rounded-2xl p-4 transition-colors flex flex-col justify-between bg-white border shadow-2xs",
                            isRunning
                              ? "border-emerald-300/80 bg-emerald-50/[0.12]"
                              : "border-slate-200/90"
                          )}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-900 text-white">
                                {pump.code}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-mono font-bold text-[10px] px-2 py-0.5 border-0 inline-flex items-center gap-1.5",
                                  isRunning
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-slate-100 text-slate-700"
                                )}
                              >
                                <span
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    isRunning ? "bg-emerald-600" : "bg-slate-400"
                                  )}
                                />
                                {isRunning ? 'AKTIF' : 'STANDBY'}
                              </Badge>
                            </div>

                            <h4 className="font-heading font-bold text-sm text-slate-900 mb-2 truncate">
                              {pump.name}
                            </h4>

                            {/* Turbin Visual di Detail Room */}
                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                                    isRunning ? "bg-[#00799e] text-white" : "bg-slate-200 text-slate-400"
                                  )}
                                >
                                  <Fan className={cn("w-3.5 h-3.5", isRunning ? "animate-spin [animation-duration:1.1s]" : "")} />
                                </div>
                                <span className="font-mono text-xs font-semibold text-slate-800">
                                  {isRunning ? '1,450 RPM' : '0 RPM'}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] text-slate-500">
                                {isRunning ? '50.0 Hz' : '0.0 Hz'}
                              </span>
                            </div>

                            {/* Telemetry Metrics 4-Grid */}
                            <div className="grid grid-cols-2 gap-1.5 text-xs mb-3 font-mono">
                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
                                <Gauge className="w-3.5 h-3.5 text-[#00799e] shrink-0" />
                                <div className="min-w-0">
                                  <span className="block text-[9px] text-slate-400 font-sans leading-none">Tekanan</span>
                                  <span className="font-bold text-slate-900 text-xs truncate block mt-0.5">
                                    {pump.metrics?.pressure_bar ? pump.metrics.pressure_bar.toFixed(2) : '0.00'} bar
                                  </span>
                                </div>
                              </div>

                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
                                <Droplets className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                <div className="min-w-0">
                                  <span className="block text-[9px] text-slate-400 font-sans leading-none">Debit</span>
                                  <span className="font-bold text-slate-900 text-xs truncate block mt-0.5">
                                    {pump.metrics?.flow_m3h ? pump.metrics.flow_m3h.toFixed(1) : '0.0'} m³/h
                                  </span>
                                </div>
                              </div>

                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <div className="min-w-0">
                                  <span className="block text-[9px] text-slate-400 font-sans leading-none">Daya</span>
                                  <span className="font-bold text-slate-900 text-xs truncate block mt-0.5">
                                    {pump.metrics?.power_kw ? pump.metrics.power_kw.toFixed(1) : '0.0'} kW
                                  </span>
                                </div>
                              </div>

                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
                                <Thermometer className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <div className="min-w-0">
                                  <span className="block text-[9px] text-slate-400 font-sans leading-none">Suhu</span>
                                  <span className="font-bold text-slate-900 text-xs truncate block mt-0.5">
                                    {pump.metrics?.motor_temp_c ? pump.metrics.motor_temp_c.toFixed(1) : '25.0'} °C
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 font-mono">
                              <Power
                                className={cn("w-3.5 h-3.5", isRunning ? 'text-emerald-600' : 'text-slate-400')}
                              />
                              KONTROL MOTOR
                            </span>

                            <div className="flex items-center gap-2">
                              <span className={cn("text-[10px] font-mono font-bold", isRunning ? "text-emerald-700" : "text-slate-400")}>
                                {isRunning ? "ON" : "OFF"}
                              </span>
                              <Switch
                                checked={isRunning}
                                onCheckedChange={() => onToggleMotor(pump.id)}
                                aria-label={`Sakelar motor ${pump.name}`}
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
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. REAL-TIME TELEMETRY LINE CHART & PUMP LOAD BAR CHART                  */}
      {/* ========================================================================= */}
      {currentRoom && (
        <PumpPerformanceCharts currentRoom={currentRoom} allRooms={rooms} />
      )}

      {/* ========================================================================= */}
      {/* 5. HISTORICAL PERFORMANCE ANALYTICS LINE CHART                            */}
      {/* ========================================================================= */}
      <HistoricalPerformanceChart currentRoom={currentRoom} allRooms={rooms} />
    </div>
  )
}
