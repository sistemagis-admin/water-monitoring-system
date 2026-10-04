import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import type { AreaRoom } from '../types/pump'
import {
  Building2,
  Plus,
  Trash2,
  Layers,
  Search,
  Pencil,
  Power,
} from 'lucide-react'

interface AreaManagementViewProps {
  rooms: AreaRoom[]
  onOpenAddArea: () => void
  onOpenEditArea: (room: AreaRoom) => void
  onDeleteArea: (areaId: string) => void
}

export const AreaManagementView: React.FC<AreaManagementViewProps> = ({
  rooms,
  onOpenAddArea,
  onOpenEditArea,
  onDeleteArea,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteCandidate, setDeleteCandidate] = useState<{
    id: string
    name: string
    code: string
    pumpsCount: number
  } | null>(null)

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleConfirmDelete = () => {
    if (deleteCandidate) {
      onDeleteArea(deleteCandidate.id)
      setDeleteCandidate(null)
    }
  }

  // Calculate real totals
  const totalPumps = rooms.reduce((acc, r) => acc + r.pumps.length, 0)
  const runningPumps = rooms.reduce(
    (acc, r) => acc + r.pumps.filter((p) => p.status === 'RUNNING').length,
    0
  )

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* 1. Page Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading font-semibold text-xl sm:text-2xl text-slate-800 tracking-tight leading-none">
            Manajemen Area &amp; Ruangan
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-1 m-0">
            Kelola stasiun kerja, ruang pompa, dan alokasi unit mesin air
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search bar (if rooms exist) */}
          {rooms.length > 0 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari ruangan atau kode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00799e] outline-hidden transition-all w-48 sm:w-56 shadow-2xs font-normal"
              />
            </div>
          )}

          {/* Add Area Button */}
          <button
            onClick={onOpenAddArea}
            className="px-4 py-2 rounded-xl bg-[#00799e] hover:bg-[#006887] active:scale-95 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm shadow-[#00799e]/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Area Baru</span>
          </button>
        </div>
      </div>

      {/* 2. Real Summary Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Ruang Pompa</span>
            <span className="font-heading font-bold text-2xl text-slate-800 leading-tight mt-0.5 block">
              {rooms.length} <span className="text-xs text-slate-400 font-normal">Ruangan</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#00799e] text-white flex items-center justify-center shadow-xs">
            <Building2 className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Pompa Terpasang</span>
            <span className="font-heading font-bold text-2xl text-slate-800 leading-tight mt-0.5 block">
              {totalPumps} <span className="text-xs text-slate-400 font-normal">Unit</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#00799e] flex items-center justify-center shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Pompa Beroperasi</span>
            <span className="font-heading font-bold text-2xl text-slate-800 leading-tight mt-0.5 block">
              {runningPumps} <span className="text-xs text-emerald-600 font-medium">Aktif</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
            <Power className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main Area Content */}
      {rooms.length === 0 ? (
        /* CLEAN EMPTY STATE HERO */
        <div className="bg-white border border-slate-200/80 rounded-2xl p-10 sm:p-14 text-center shadow-xs flex flex-col items-center justify-center min-h-[360px]">
          <div className="w-16 h-16 rounded-2xl bg-[#00799e] text-white flex items-center justify-center mb-4 shadow-md shadow-[#00799e]/20">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-heading font-semibold text-xl text-slate-900 mb-1.5">
            Belum Ada Area / Ruangan Terdaftar
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed font-normal">
            Mulai penyiapan sistem dengan mendaftarkan ruang pompa pertama Anda (misalnya Ruang Intake, Filtrasi, atau Distribusi Booster).
          </p>
          <button
            onClick={onOpenAddArea}
            className="px-5 py-2.5 rounded-xl bg-[#00799e] hover:bg-[#006887] active:scale-95 text-white text-xs font-medium shadow-md shadow-[#00799e]/25 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Area Pertama</span>
          </button>
        </div>
      ) : (
        /* ROOM CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room, idx) => {
            const pumpCount = room.pumps.length
            const runningCount = room.pumps.filter((p) => p.status === 'RUNNING').length

            return (
              <div
                key={room.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Top: Code badge & Delete button */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center">
                        {room.number || `0${idx + 1}`}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono font-medium text-xs text-slate-700 border border-slate-200">
                        {room.code}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setDeleteCandidate({
                          id: room.id,
                          name: room.name,
                          code: room.code,
                          pumpsCount: pumpCount,
                        })
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer group"
                      title={`Hapus Ruangan ${room.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Area Title */}
                  <h3 className="font-heading font-semibold text-base text-slate-900 mb-1 leading-snug">
                    {room.name}
                  </h3>
                  <p className="text-xs text-slate-400 m-0 mb-4 font-mono">
                    Tag: {room.sensorTag || room.code}
                  </p>

                  {/* Pump count info pill */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#00799e]" />
                      <span className="text-xs font-medium text-slate-700">
                        Alokasi Pompa
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        pumpCount > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {pumpCount} Unit {runningCount > 0 && `(${runningCount} Aktif)`}
                    </span>
                  </div>
                </div>

                {/* Card Actions: Edit Data Ruangan */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => onOpenEditArea(room)}
                    className="w-full py-2 px-3 rounded-xl bg-[#00799e] hover:bg-[#006887] active:scale-95 text-white text-xs font-medium transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Data Ruangan</span>
                  </button>
                </div>
              </div>
            )
          })}

          {/* Add Area Slot Card */}
          <div
            onClick={onOpenAddArea}
            className="border-2 border-dashed border-slate-200 hover:border-[#00799e] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-white/80 group min-h-[200px]"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-[#00799e] text-slate-400 group-hover:text-white flex items-center justify-center mb-2.5 transition-colors shadow-2xs group-hover:scale-105">
              <Plus className="w-5 h-5" />
            </div>
            <span className="font-medium text-xs sm:text-sm text-slate-700 group-hover:text-[#00799e] transition-colors">
              Tambah Area Baru
            </span>
            <p className="text-[11px] text-slate-400 m-0 mt-0.5 max-w-[180px] font-normal">
              Daftarkan stasiun ruangan baru untuk penempatan pompa
            </p>
          </div>
        </div>
      )}

      {/* 4. Delete Confirmation Modal */}
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
                    Hapus Area / Ruangan
                  </h4>
                  <p className="text-xs text-slate-500 m-0 font-normal">
                    Konfirmasi penghapusan area dari sistem
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-normal">Kode Area:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {deleteCandidate.code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-normal">Nama Ruangan:</span>
                  <span className="font-medium text-slate-900">
                    {deleteCandidate.name}
                  </span>
                </div>
                {deleteCandidate.pumpsCount > 0 && (
                  <div className="flex justify-between text-amber-600 font-medium pt-1">
                    <span>Pompa Terpasang:</span>
                    <span>{deleteCandidate.pumpsCount} Unit</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-600 m-0 leading-relaxed font-normal">
                Apakah Anda yakin ingin menghapus area ini? Seluruh data ruangan akan dihapus dari sistem.
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
                  Ya, Hapus Area
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
