import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import type { AreaRoom, PumpAsset } from '../types/pump'
import { CustomSelect, type SelectOption } from './CustomSelect'
import {
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  AlertCircle,
  Search,
  Pencil,
  Building2,
} from 'lucide-react'

interface PumpManagementTableProps {
  rooms: AreaRoom[]
  onOpenAddPump: () => void
  onOpenEditPump?: (pump: PumpAsset) => void
  onDeletePump: (pumpId: string) => void
  onToggleMotor?: (pumpId: string) => void
}

export const PumpManagementTable: React.FC<PumpManagementTableProps> = ({
  rooms,
  onOpenAddPump,
  onOpenEditPump,
  onDeletePump,
  onToggleMotor,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRoom, setFilterRoom] = useState<string>('ALL')
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; name: string; code: string } | null>(null)

  // Flatten all pumps across all rooms with their room context
  const allPumps: Array<{
    pump: PumpAsset
    room: AreaRoom
    roomIndex: number
    motorIndex: 0 | 1
  }> = []

  rooms.forEach((room, rIdx) => {
    room.pumps.forEach((pump, pIdx) => {
      allPumps.push({
        pump,
        room,
        roomIndex: rIdx,
        motorIndex: (pIdx % 2) as 0 | 1,
      })
    })
  })

  // Filter pumps
  const filteredPumps = allPumps.filter(({ pump, room }) => {
    const matchesSearch =
      pump.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pump.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRoom = filterRoom === 'ALL' || room.id === filterRoom

    return matchesSearch && matchesRoom
  })

  const getStatusBadge = (status: PumpAsset['status']) => {
    switch (status) {
      case 'RUNNING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white bg-emerald-600 inline-flex items-center shadow-2xs">
            RUNNING
          </span>
        )
      case 'FAULT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white bg-rose-600 inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            FAULT
          </span>
        )
      case 'MAINTENANCE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white bg-amber-500 inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            MAINTENANCE
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-slate-600 bg-slate-200 inline-flex items-center">
            STOPPED
          </span>
        )
    }
  }

  const handleConfirmDelete = () => {
    if (deleteCandidate) {
      onDeletePump(deleteCandidate.id)
      setDeleteCandidate(null)
    }
  }

  return (
    <section className="bg-white border border-slate-200 rounded-[22px] p-5 sm:p-6 shadow-xs mb-6 select-none">
      {/* Table Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#00799e] flex items-center justify-center shrink-0 shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-lg sm:text-xl text-slate-900 m-0 leading-tight">
              Daftar &amp; Manajemen Asset Pompa
            </h3>
            <span className="text-xs text-slate-500 font-normal">
              Database Pompa terdaftar di SCADA &amp; IoT System (Tabel PostgreSQL <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-700">assets</code>)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari pompa atau kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00799e] outline-hidden transition-all w-44 sm:w-56 font-normal shadow-2xs"
            />
          </div>

          {/* Room filter with CustomSelect */}
          <CustomSelect
            options={[
              { value: 'ALL', label: `Semua Ruangan (${rooms.length})`, icon: <Building2 className="w-3.5 h-3.5 text-slate-400" /> },
              ...rooms.map((r) => ({
                value: r.id,
                label: r.name,
                sublabel: `${r.pumps.length} pompa`,
                icon: <Building2 className="w-3.5 h-3.5 text-[#00799e]" />,
              })),
            ]}
            value={filterRoom}
            onChange={(val) => setFilterRoom(val)}
            size="sm"
            className="w-48"
            minPopoverWidth="220px"
          />

          {/* Add Pump Button */}
          <button
            onClick={onOpenAddPump}
            className="px-3.5 py-1.5 rounded-xl bg-[#00799e] hover:bg-[#006887] active:scale-95 text-white text-xs font-medium transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pompa</span>
          </button>
        </div>
      </div>

      {/* Pumps Table */}
      {filteredPumps.length === 0 ? (
        <div className="py-10 text-center flex flex-col items-center justify-center text-slate-400 bg-slate-50/70 border border-slate-100 rounded-xl">
          <Layers className="w-8 h-8 text-slate-300 mb-2" />
          <p className="font-bold text-sm text-slate-700 m-0">Tidak Ada Pompa Ditemukan</p>
          <span className="text-xs text-slate-500">
            {searchQuery
              ? 'Tidak ada pompa yang cocok dengan pencarian.'
              : 'Klik tombol "Tambah Pompa" di atas untuk mendaftarkan pompa baru ke sistem.'}
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Tag / Kode</th>
                <th className="py-2.5 px-3">Nama Pompa / Unit</th>
                <th className="py-2.5 px-3">Area / Lokasi</th>
                <th className="py-2.5 px-3">Slot Motor</th>
                <th className="py-2.5 px-3">Status Operasi</th>
                <th className="py-2.5 px-3">Tekanan &amp; Debit Live</th>
                <th className="py-2.5 px-3">Daya Aktif</th>
                <th className="py-2.5 px-3 text-center">Kontrol Saklar</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPumps.map(({ pump, room, roomIndex, motorIndex }) => {
                const isRunning = pump.status === 'RUNNING'

                return (
                  <tr key={pump.id || `${room.id}-${motorIndex}`} className="hover:bg-slate-50/60 transition-colors">
                    {/* Kode */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px]">
                        {pump.code}
                      </span>
                    </td>

                    {/* Nama Pompa */}
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{pump.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {pump.id.slice(0, 18)}...
                        </span>
                      </div>
                    </td>

                    {/* Area / Lokasi */}
                    <td className="py-3 px-3">
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200/80 inline-block truncate max-w-[180px]"
                        title={room.name}
                      >
                        {room.name}
                      </span>
                    </td>

                    {/* Slot Motor */}
                    <td className="py-3 px-3 font-semibold">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#00799e]/10 text-[#00799e] border border-[#00799e]/30">
                        Motor {motorIndex + 1} (M{motorIndex + 1})
                      </span>
                    </td>

                    {/* Status Live */}
                    <td className="py-3 px-3">
                      {getStatusBadge(pump.status)}
                    </td>

                    {/* Tekanan & Debit */}
                    <td className="py-3 px-3 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {pump.metrics.pressure_bar.toFixed(2)} bar
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600">
                          {pump.metrics.flow_m3h.toFixed(1)} m³/h
                        </span>
                      </div>
                    </td>

                    {/* Daya Aktif */}
                    <td className="py-3 px-3 font-mono text-xs">
                      <div className="flex items-center gap-1 font-semibold text-slate-700">
                        <Zap className={`w-3 h-3 ${isRunning ? 'text-amber-500' : 'text-slate-400'}`} />
                        <span>{pump.metrics.power_kw.toFixed(1)} kW</span>
                      </div>
                    </td>

                    {/* Kontrol Saklar (Toggle) */}
                    <td className="py-3 px-3 text-center">
                      {onToggleMotor && (
                        <button
                          type="button"
                          onClick={() => onToggleMotor(pump.id)}
                          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer inline-flex items-center px-0.5 ${
                            isRunning ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                          title={`Klik untuk ${isRunning ? 'Matikan' : 'Nyalakan'} ${pump.name}`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-200 transform ${
                              isRunning ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      )}
                    </td>

                    {/* Aksi Edit & Hapus */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onOpenEditPump && (
                          <button
                            onClick={() => onOpenEditPump(pump)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#00799e] hover:bg-[#00799e]/10 transition-colors cursor-pointer group"
                            title={`Edit data pompa ${pump.name}`}
                          >
                            <Pencil className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setDeleteCandidate({
                              id: pump.id,
                              name: pump.name,
                              code: pump.code,
                            })
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer group"
                          title={`Hapus Pompa ${pump.name} dari database`}
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
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
                    Aksi ini akan menghapus aset dari database sistem
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
                Apakah Anda yakin ingin menghapus data pompa ini? Seluruh riwayat telemetri dan binding sensor yang terkait dengan pompa ini akan dinonaktifkan.
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
    </section>
  )
}
