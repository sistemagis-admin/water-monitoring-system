import React, { useState, useRef, useEffect } from 'react'
import type { AreaRoom, PumpAsset } from '../types/pump'
import {
  Layers,
  Plus,
  Trash2,
  Zap,
  Gauge,
  Power,
  Search,
  LayoutGrid,
  List,
  Thermometer,
  Droplets,
  Building2,
  Pencil,
  ChevronDown,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { CustomSelect } from './CustomSelect'
import { PumpManagementTable } from './PumpManagementTable'
import { cn } from 'cn'

interface PumpAreaViewProps {
  rooms: AreaRoom[]
  onOpenAddPump: (preselectedAreaId?: string) => void
  onOpenEditPump: (pump: PumpAsset) => void
  onDeletePump: (pumpId: string) => void
  onToggleMotor: (pumpId: string) => void
}

export const PumpAreaView: React.FC<PumpAreaViewProps> = ({
  rooms,
  onOpenAddPump,
  onOpenEditPump,
  onDeletePump,
  onToggleMotor,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('ALL')
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const areaDropdownRef = useRef<HTMLDivElement>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<{
    id: string
    name: string
    code: string
  } | null>(null)

  // Reset to page 1 whenever area filter, search query, or page size changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedAreaFilter, searchQuery, pageSize])

  // Close area filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(e.target as Node)) {
        setIsAreaDropdownOpen(false)
      }
    }
    if (isAreaDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAreaDropdownOpen])

  // Flatten all pumps with their room metadata
  const allPumpsWithRoom: Array<{
    pump: PumpAsset
    room: AreaRoom
    roomIdx: number
    motorIdx: 0 | 1
  }> = rooms.flatMap((room, roomIdx) =>
    room.pumps.map((pump, pIdx) => ({
      pump,
      room,
      roomIdx,
      motorIdx: (pIdx % 2) as 0 | 1,
    }))
  )

  // Filter pumps by area dropdown and search query
  const filteredPumpsWithRoom = allPumpsWithRoom.filter(({ pump, room }) => {
    const matchesArea = selectedAreaFilter === 'ALL' || room.id === selectedAreaFilter
    const matchesQuery =
      searchQuery === '' ||
      pump.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pump.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesArea && matchesQuery
  })

  // Summary Metrics calculations
  const totalPumpsCount = filteredPumpsWithRoom.length
  const runningPumpsCount = filteredPumpsWithRoom.filter(({ pump }) => pump.status === 'RUNNING').length

  const avgPressure =
    totalPumpsCount > 0
      ? (
          filteredPumpsWithRoom.reduce((acc, { pump }) => acc + (pump.metrics?.pressure_bar || 0), 0) /
          totalPumpsCount
        ).toFixed(2)
      : '0.00'

  const totalPower =
    totalPumpsCount > 0
      ? filteredPumpsWithRoom
          .reduce((acc, { pump }) => acc + (pump.metrics?.power_kw || 0), 0)
          .toFixed(1)
      : '0.0'

  // Pagination with user-selectable page size (10, 25, 50, 100)
  const totalPages = Math.ceil(filteredPumpsWithRoom.length / pageSize) || 1
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startIdx = (safePage - 1) * pageSize
  const paginatedPumps = filteredPumpsWithRoom.slice(startIdx, startIdx + pageSize)
  const showAddCardInGrid = paginatedPumps.length < pageSize

  const handleConfirmDelete = () => {
    if (deleteCandidate) {
      onDeletePump(deleteCandidate.id)
      setDeleteCandidate(null)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* 1. Tactical SCADA Asset Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-mono font-medium shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 led-pulse-emerald"></span>
            <span className="tracking-wider text-[11px]">PUMP ASSETS</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-mono shadow-2xs">
            <span className="text-slate-400">TOTAL:</span>
            <span className="font-bold text-slate-800">{totalPumpsCount} UNITS</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-600 font-bold">{runningPumpsCount} RUNNING</span>
            {selectedAreaFilter !== 'ALL' && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-[#00799e] font-semibold truncate max-w-[120px]">
                  {rooms.find((r) => r.id === selectedAreaFilter)?.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Top Right Action Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Custom Area Filter Dropdown */}
          {rooms.length > 0 && (
            <div className="relative" ref={areaDropdownRef}>
              <button
                type="button"
                onClick={() => setIsAreaDropdownOpen((prev) => !prev)}
                className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-xl shadow-2xs cursor-pointer hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <Building2 className="w-3.5 h-3.5 text-[#00799e]" />
                <span>
                  {selectedAreaFilter === 'ALL'
                    ? `All Stations (${rooms.length})`
                    : rooms.find((r) => r.id === selectedAreaFilter)?.name || 'Select Station'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isAreaDropdownOpen ? 'rotate-180 text-[#00799e]' : ''
                  }`}
                />
              </button>

              {isAreaDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAreaFilter('ALL')
                      setIsAreaDropdownOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      selectedAreaFilter === 'ALL'
                        ? 'bg-[#00799e]/10 text-[#00799e] font-semibold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span>All Stations ({rooms.length})</span>
                    {selectedAreaFilter === 'ALL' && <Check className="w-3.5 h-3.5 text-[#00799e]" />}
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  {rooms.map((r) => {
                    const isSelected = selectedAreaFilter === r.id
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setSelectedAreaFilter(r.id)
                          setIsAreaDropdownOpen(false)
                        }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#00799e]/10 text-[#00799e] font-semibold'
                            : 'text-slate-700 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="truncate">{r.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({r.pumps.length} pumps)
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#00799e] shrink-0 ml-2" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white text-[#00799e] shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white text-[#00799e] shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Add Pump Button */}
          <button
            onClick={() => onOpenAddPump(selectedAreaFilter !== 'ALL' ? selectedAreaFilter : undefined)}
            className="px-4 py-2 bg-[#00799e] hover:bg-[#006887] active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Pump</span>
          </button>
        </div>
      </div>

      {/* 2. Top 3 Hardware Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Pumps */}
        <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500">
              TOTAL PUMPS
            </span>
            <div className="size-8 rounded-lg bg-[#00799e]/10 text-[#00799e] flex items-center justify-center">
              <Layers className="size-4" />
            </div>
          </div>
          <div className="my-1 flex items-baseline gap-2">
            <span className="font-mono tabular-nums font-bold text-3xl text-slate-900 tracking-tight">
              {totalPumpsCount}
            </span>
            <span className="text-xs font-mono font-medium text-slate-400">UNITS</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-slate-400">ACTIVE:</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500 inline-block led-pulse-emerald"></span>
              {runningPumpsCount} Running
            </span>
          </div>
        </div>

        {/* Card 2: Avg Pressure */}
        <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500">
              AVG DISCHARGE PRESSURE
            </span>
            <div className="size-8 rounded-lg bg-[#00799e]/10 text-[#00799e] flex items-center justify-center">
              <Gauge className="size-4" />
            </div>
          </div>
          <div className="my-1 flex items-baseline gap-2">
            <span className="font-mono tabular-nums font-bold text-3xl text-slate-900 tracking-tight">
              {avgPressure}
            </span>
            <span className="text-xs font-mono font-medium text-slate-400">bar</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-slate-400">TARGET:</span>
            <span className="font-semibold text-[#00799e]">2.0 – 6.5 bar</span>
          </div>
        </div>

        {/* Card 3: Total Power */}
        <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500">
              TOTAL POWER LOAD
            </span>
            <div className="size-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="size-4" />
            </div>
          </div>
          <div className="my-1 flex items-baseline gap-2">
            <span className="font-mono tabular-nums font-bold text-3xl text-slate-900 tracking-tight">
              {totalPower}
            </span>
            <span className="text-xs font-mono font-medium text-slate-400">kW</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-slate-400">EFFICIENCY:</span>
            <span className="font-bold text-emerald-600">92.4%</span>
          </div>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="relative">
        <Search className="size-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <Input
          type="text"
          placeholder="Search pump by code (e.g. P-01), name, or station..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-4 bg-white rounded-xl text-xs font-mono h-10 shadow-2xs"
        />
      </div>

      {/* 4. Main Pump Content: Table or Unified Cards Grid */}
      {viewMode === 'table' ? (
        <PumpManagementTable
          rooms={rooms}
          onOpenAddPump={() => onOpenAddPump(selectedAreaFilter !== 'ALL' ? selectedAreaFilter : undefined)}
          onOpenEditPump={onOpenEditPump}
          onDeletePump={onDeletePump}
          onToggleMotor={onToggleMotor}
        />
      ) : (
        /* UNIFIED GRID CARDS VIEW */
        <div className="space-y-4">
          {filteredPumpsWithRoom.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 sm:p-14 text-center flex flex-col items-center justify-center min-h-[260px] shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-base text-slate-900 mb-1">
                No Pumps Found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed font-normal">
                {searchQuery
                  ? `No pumps match the search "${searchQuery}".`
                  : selectedAreaFilter !== 'ALL'
                  ? `No pumps registered in this station.`
                  : `No pumps registered in the system.`}
              </p>
              <Button
                onClick={() => onOpenAddPump(selectedAreaFilter !== 'ALL' ? selectedAreaFilter : undefined)}
                className="bg-[#00799e] hover:bg-[#006887] text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add Pump</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Unified 3-column Grid of Pump Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedPumps.map(({ pump, room }) => {
                  const isRunning = pump.status === 'RUNNING'
                  const isFault = pump.status === 'FAULT'

                  return (
                    <div
                      key={pump.id}
                      className={cn(
                        "bg-white rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full relative overflow-hidden",
                        isRunning && "ring-2 ring-emerald-500/25 bg-gradient-to-b from-emerald-500/[0.03] to-white",
                        isFault && "ring-2 ring-rose-500/25 bg-gradient-to-b from-rose-500/[0.03] to-white"
                      )}
                    >
                      <div>
                        {/* Card Top: Code, Status & Actions */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs tracking-wider">
                              {pump.code}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-mono font-bold text-[10px] px-2 py-0.5 border-0 inline-flex items-center gap-1.5",
                                isRunning
                                  ? "bg-emerald-50 text-emerald-700"
                                  : isFault
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-slate-100 text-slate-600"
                              )}
                            >
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  isRunning
                                    ? "bg-emerald-500 led-pulse-emerald"
                                    : isFault
                                    ? "bg-rose-500 led-pulse-rose"
                                    : "bg-slate-400"
                                )}
                              />
                              {pump.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onOpenEditPump(pump)}
                              className="text-slate-400 hover:text-[#00799e] hover:bg-slate-100 rounded-lg cursor-pointer h-8 w-8"
                              title={`Edit ${pump.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                setDeleteCandidate({
                                  id: pump.id,
                                  name: pump.name,
                                  code: pump.code,
                                })
                              }
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer h-8 w-8"
                              title={`Delete ${pump.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Pump Title & Room Tag */}
                        <div className="mb-4">
                          <h4 className="font-heading font-semibold text-base text-slate-900 leading-snug">
                            {pump.name}
                          </h4>
                          <p className="text-xs font-mono text-slate-500 font-normal mt-1 flex items-center gap-1.5">
                            <span>M{pump.motorIndex + 1}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-700 font-medium">{room.name}</span>
                          </p>
                        </div>

                        {/* Telemetry Metrics Grid (Hardware SCADA Box) */}
                        <div className="grid grid-cols-2 gap-2.5 mb-4 bg-slate-50/80 p-3 rounded-xl text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-cyan-100/60 text-[#00799e] flex items-center justify-center shrink-0">
                              <Gauge className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 leading-none mb-0.5">
                                Pressure
                              </span>
                              <span className="font-mono tabular-nums font-bold text-slate-900 text-xs">
                                {pump.metrics?.pressure_bar ? pump.metrics.pressure_bar.toFixed(2) : '0.00'}
                                <span className="text-[10px] text-slate-400 font-normal ml-0.5">bar</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-teal-100/60 text-teal-600 flex items-center justify-center shrink-0">
                              <Droplets className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 leading-none mb-0.5">
                                Flow Rate
                              </span>
                              <span className="font-mono tabular-nums font-bold text-slate-900 text-xs">
                                {pump.metrics?.flow_m3h ? pump.metrics.flow_m3h.toFixed(1) : '0.0'}
                                <span className="text-[10px] text-slate-400 font-normal ml-0.5">m³/h</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-100/60 text-amber-600 flex items-center justify-center shrink-0">
                              <Zap className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 leading-none mb-0.5">
                                Power
                              </span>
                              <span className="font-mono tabular-nums font-bold text-slate-900 text-xs">
                                {pump.metrics?.power_kw ? pump.metrics.power_kw.toFixed(1) : '0.0'}
                                <span className="text-[10px] text-slate-400 font-normal ml-0.5">kW</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-rose-100/60 text-rose-500 flex items-center justify-center shrink-0">
                              <Thermometer className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 leading-none mb-0.5">
                                Temp
                              </span>
                              <span className="font-mono tabular-nums font-bold text-slate-900 text-xs">
                                {pump.metrics?.motor_temp_c ? pump.metrics.motor_temp_c.toFixed(1) : '0.0'}
                                <span className="text-[10px] text-slate-400 font-normal ml-0.5">°C</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Motor Switch Control Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                        <span className="text-xs font-mono font-medium text-slate-600 flex items-center gap-1.5">
                          <Power className={cn("w-3.5 h-3.5", isRunning ? 'text-emerald-600' : 'text-slate-400')} />
                          <span className="text-[11px]">MOTOR CONTROL</span>
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

                {/* Add Pump Card in grid */}
                {showAddCardInGrid && (
                  <div
                    onClick={() => onOpenAddPump(selectedAreaFilter !== 'ALL' ? selectedAreaFilter : undefined)}
                    className="bg-white/60 hover:bg-white border-2 border-dashed border-slate-200 hover:border-[#00799e] rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer group min-h-[240px] shadow-2xs hover:shadow-xs"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 group-hover:bg-[#00799e] text-slate-400 group-hover:text-white flex items-center justify-center mb-3 transition-all shadow-2xs group-hover:scale-105">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="font-mono font-bold text-xs text-slate-800 group-hover:text-[#00799e] transition-colors">
                      + ADD NEW PUMP
                    </span>
                    <p className="text-[11px] text-slate-400 m-0 mt-1 max-w-[190px] font-normal leading-relaxed">
                      {selectedAreaFilter !== 'ALL'
                        ? `Register unit to ${rooms.find((r) => r.id === selectedAreaFilter)?.name || 'this station'}`
                        : 'Register new pump unit to SCADA'}
                    </p>
                  </div>
                )}
              </div>

              {/* Overall Pagination Bar with Page Size Selector */}
              <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="font-normal text-[11px] text-slate-500">
                    Showing {filteredPumpsWithRoom.length > 0 ? startIdx + 1 : 0}-
                    {Math.min(startIdx + pageSize, filteredPumpsWithRoom.length)} of {filteredPumpsWithRoom.length} pumps
                  </span>

                  <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                    <span className="text-[11px] text-slate-500 font-normal">Show:</span>
                    <CustomSelect
                      options={[
                        { value: 10, label: '10 / page' },
                        { value: 25, label: '25 / page' },
                        { value: 50, label: '50 / page' },
                        { value: 100, label: '100 / page' },
                      ]}
                      value={pageSize}
                      onChange={(val) => {
                        setPageSize(Number(val))
                        setCurrentPage(1)
                      }}
                      size="sm"
                      className="w-32"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border-0 bg-white hover:bg-slate-100 text-slate-600 shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer h-8 w-8"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        pageNum === safePage
                          ? "bg-[#00799e] text-white shadow-2xs"
                          : "bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
                      )}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg border-0 bg-white hover:bg-slate-100 text-slate-600 shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer h-8 w-8"
                    title="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Delete Confirmation Modal (shadcn AlertDialog) */}
      <AlertDialog
        open={!!deleteCandidate}
        onOpenChange={(open) => {
          if (!open) setDeleteCandidate(null)
        }}
      >
        <AlertDialogContent className="rounded-2xl border-0 bg-white p-6 shadow-xl sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <AlertDialogTitle className="font-heading font-semibold text-lg text-slate-900">
                  Confirm Delete Pump
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-slate-500 font-normal">
                  This pump will be permanently removed from SCADA.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          {deleteCandidate && (
            <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1.5 my-1">
              <div className="flex justify-between">
                <span className="text-slate-500 font-normal">Pump Tag / Code:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {deleteCandidate.code}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-normal">Pump Name:</span>
                <span className="font-medium text-slate-900">
                  {deleteCandidate.name}
                </span>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Are you sure you want to delete this pump? This action cannot be undone.
          </p>

          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              onClick={() => setDeleteCandidate(null)}
              className="rounded-xl border-0 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-xl border-0 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              Delete Pump
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
