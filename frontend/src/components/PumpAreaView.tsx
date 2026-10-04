import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
import { CustomSelect, type SelectOption } from './CustomSelect'
import { PumpManagementTable } from './PumpManagementTable'

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
      {/* 1. Page Title & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading font-semibold text-xl sm:text-2xl text-slate-800 tracking-tight leading-none">
            Manajemen Unit Pompa
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-1 m-0">
            Daftar seluruh unit pompa terpasang per stasiun ruangan
          </p>
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
                    ? `Semua Area (${rooms.length})`
                    : rooms.find((r) => r.id === selectedAreaFilter)?.name || 'Pilih Area'}
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
                    <span>Semua Area ({rooms.length})</span>
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
                            ({r.pumps.length} pompa)
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
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white text-[#00799e] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white text-[#00799e] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
          </div>

          {/* Add Pump Button */}
          <button
            onClick={() => onOpenAddPump(selectedAreaFilter !== 'ALL' ? selectedAreaFilter : undefined)}
            className="px-4 py-2 bg-[#00799e] hover:bg-[#006887] active:scale-95 text-white text-xs font-medium rounded-xl shadow-sm shadow-[#00799e]/20 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pompa</span>
          </button>
        </div>
      </div>

      {/* 2. Top 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Total Pumps */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium text-slate-500">Total Unit Pompa</span>
            <div className="w-8 h-8 rounded-xl bg-[#00799e]/10 text-[#00799e] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="my-0.5">
            <span className="font-heading font-bold text-2xl sm:text-3xl text-slate-800 tracking-tight">
              {totalPumpsCount} <span className="text-xs font-normal text-slate-400">Unit</span>
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-normal pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <span>Status Aktif:</span>
            <span className="font-medium text-emerald-600">{runningPumpsCount} Beroperasi</span>
          </div>
        </div>

        {/* Card 2: Avg Pressure */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium text-slate-500">Tekanan Rata-rata</span>
            <div className="w-8 h-8 rounded-xl bg-[#00799e]/10 text-[#00799e] flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="my-0.5">
            <span className="font-heading font-bold text-2xl sm:text-3xl text-slate-800 tracking-tight">
              {avgPressure} <span className="text-xs font-normal text-slate-400">bar</span>
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-normal pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <span>Standar Operasional:</span>
            <span className="font-medium text-[#00799e]">2.0 - 6.5 bar</span>
          </div>
        </div>

        {/* Card 3: Total Power */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium text-slate-500">Daya Listrik Aktif</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="my-0.5">
            <span className="font-heading font-bold text-2xl sm:text-3xl text-slate-800 tracking-tight">
              {totalPower} <span className="text-xs font-normal text-slate-400">kW</span>
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-normal pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <span>Efisiensi Motor:</span>
            <span className="font-medium text-emerald-600">92.4%</span>
          </div>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari pompa berdasarkan nama, kode (misal: P-01)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00799e] outline-hidden transition-all shadow-2xs font-normal"
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
            <div className="bg-white border border-slate-200/80 rounded-2xl p-10 sm:p-14 text-center shadow-xs flex flex-col items-center justify-center min-h-[280px]">
              <div className="w-14 h-14 rounded-2xl bg-[#00799e]/10 text-[#00799e] flex items-center justify-center mb-3.5 shadow-xs">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-slate-900 mb-1">
                Tidak Ada Pompa Ditemukan
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed font-normal">
                {searchQuery
                  ? `Tidak ada unit pompa yang sesuai dengan pencarian "${searchQuery}".`
                  : selectedAreaFilter !== 'ALL'
                  ? `Belum ada unit pompa terdaftar di area ini.`
                  : `Belum ada pompa yang terdaftar di seluruh stasiun ruangan.`}
              </p>
              <button
                onClick={() => onOpenAddPump(selectedAreaFilter !== 'ALL' ? selectedAreaFilter : undefined)}
                className="px-4 py-2 rounded-xl bg-[#00799e] hover:bg-[#006887] active:scale-95 text-white text-xs font-medium shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Pasang Pompa Baru</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Unified 3-column Grid of Pump Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedPumps.map(({ pump, room, roomIdx, motorIdx }) => {
                  const isRunning = pump.status === 'RUNNING'

                  return (
                    <div
                      key={pump.id}
                      className={`bg-white border rounded-2xl p-4.5 transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
                        isRunning
                          ? 'border-emerald-400 ring-2 ring-emerald-400/20'
                          : 'border-slate-200/80'
                      }`}
                    >
                      <div>
                        {/* Card Top */}
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-50 font-mono font-medium text-xs text-slate-900 border border-slate-200">
                              {pump.code}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center ${
                                isRunning
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : pump.status === 'FAULT'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {pump.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onOpenEditPump(pump)}
                              className="p-1 rounded-lg text-slate-400 hover:text-[#00799e] hover:bg-[#00799e]/10 transition-colors cursor-pointer"
                              title={`Edit ${pump.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteCandidate({
                                  id: pump.id,
                                  name: pump.name,
                                  code: pump.code,
                                })
                              }
                              className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title={`Hapus ${pump.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Pump Title & Room Tag */}
                        <div className="mb-3">
                          <h4 className="font-heading font-medium text-sm text-slate-900 m-0 leading-tight">
                            {pump.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-normal">
                            Motor {pump.motorIndex + 1} (M{pump.motorIndex + 1}) · Area: <strong className="text-slate-600 font-semibold">{room.name}</strong>
                          </span>
                        </div>

                        {/* Telemetry Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Gauge className="w-3.5 h-3.5 text-[#00799e] shrink-0" />
                            <div>
                              <span className="block text-[10px] text-slate-400 leading-none">
                                Tekanan
                              </span>
                              <span className="font-mono font-medium text-slate-800">
                                {pump.metrics?.pressure_bar ? pump.metrics.pressure_bar.toFixed(2) : '0.00'} bar
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Droplets className="w-3.5 h-3.5 text-[#00799e] shrink-0" />
                            <div>
                              <span className="block text-[10px] text-slate-400 leading-none">
                                Debit
                              </span>
                              <span className="font-mono font-medium text-slate-800">
                                {pump.metrics?.flow_m3h ? pump.metrics.flow_m3h.toFixed(1) : '0.0'} m³/h
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <div>
                              <span className="block text-[10px] text-slate-400 leading-none">
                                Daya Listrik
                              </span>
                              <span className="font-mono font-medium text-slate-800">
                                {pump.metrics?.power_kw ? pump.metrics.power_kw.toFixed(1) : '0.0'} kW
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Thermometer className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <div>
                              <span className="block text-[10px] text-slate-400 leading-none">
                                Suhu Motor
                              </span>
                              <span className="font-mono font-medium text-slate-800">
                                {pump.metrics?.motor_temp_c ? pump.metrics.motor_temp_c.toFixed(1) : '0.0'} °C
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Switch Control */}
                      <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                          <Power className={`w-3.5 h-3.5 ${isRunning ? 'text-emerald-600' : 'text-slate-400'}`} />
                          Kontrol Saklar
                        </span>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={isRunning}
                          onClick={() => onToggleMotor(pump.id)}
                          className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer inline-flex items-center px-0.5 ${
                            isRunning ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                          title={`Klik untuk ${isRunning ? 'Matikan' : 'Nyalakan'} ${pump.name}`}
                        >
                          <span
                            className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform duration-200 transform ${
                              isRunning ? 'translate-x-4.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Add Pump Card in grid (shown if space available on this page) */}
                {showAddCardInGrid && (
                  <div
                    onClick={() => onOpenAddPump(selectedAreaFilter !== 'ALL' ? selectedAreaFilter : undefined)}
                    className="border-2 border-dashed border-slate-200 hover:border-[#00799e] bg-white rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-slate-50/70 group min-h-[200px]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-[#00799e] text-slate-400 group-hover:text-white flex items-center justify-center mb-2 transition-colors shadow-2xs group-hover:scale-105">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-xs sm:text-sm text-slate-700 group-hover:text-[#00799e] transition-colors">
                      Pasang Pompa Baru
                    </span>
                    <p className="text-[11px] text-slate-400 m-0 mt-0.5 max-w-[180px] font-normal">
                      {selectedAreaFilter !== 'ALL'
                        ? `Daftarkan unit ke ${rooms.find((r) => r.id === selectedAreaFilter)?.name || 'area ini'}`
                        : 'Daftarkan unit pompa baru ke sistem'}
                    </p>
                  </div>
                )}
              </div>

              {/* Overall Pagination Bar with Page Size Selector (10, 25, 50, 100) */}
              <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="font-normal text-[11px] text-slate-500">
                    Menampilkan {filteredPumpsWithRoom.length > 0 ? startIdx + 1 : 0}-
                    {Math.min(startIdx + pageSize, filteredPumpsWithRoom.length)} dari {filteredPumpsWithRoom.length} pompa
                  </span>

                  <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                    <span className="text-[11px] text-slate-500 font-normal">Tampilkan:</span>
                    <CustomSelect
                      options={[
                        { value: 10, label: '10 / halaman' },
                        { value: 25, label: '25 / halaman' },
                        { value: 50, label: '50 / halaman' },
                        { value: 100, label: '100 / halaman' },
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
                  <button
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-6 h-6 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        pageNum === safePage
                          ? 'bg-[#00799e] text-white shadow-2xs'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Halaman Selanjutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {deleteCandidate &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeleteCandidate(null)
            }}
          >
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-5 flex flex-col gap-3.5">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-base text-slate-900 m-0">
                    Konfirmasi Hapus Pompa
                  </h4>
                  <p className="text-xs text-slate-500 m-0 font-normal">
                    Aset akan dihapus dari sistem
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-normal">Kode Pompa:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {deleteCandidate.code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-normal">Nama Asset:</span>
                  <span className="font-medium text-slate-900">
                    {deleteCandidate.name}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 m-0 leading-relaxed font-normal">
                Apakah Anda yakin ingin menghapus data pompa ini? Pompa ini akan dihapus permanen dari daftar.
              </p>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteCandidate(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  Ya, Hapus Pompa
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
