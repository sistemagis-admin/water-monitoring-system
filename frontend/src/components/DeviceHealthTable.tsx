import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import type { DeviceGateway } from '../types/pump'
import { Server, Wifi, Cpu, Clock, Network, Radio, Plus, Trash2 } from 'lucide-react'

interface DeviceHealthTableProps {
  gateways: DeviceGateway[]
  onOpenAddDevice?: () => void
  onDeleteDevice?: (id: string) => void
}

export const DeviceHealthTable: React.FC<DeviceHealthTableProps> = ({
  gateways,
  onOpenAddDevice,
  onDeleteDevice,
}) => {
  const [deleteCandidate, setDeleteCandidate] = useState<DeviceGateway | null>(null)

  const handleConfirmDelete = () => {
    if (deleteCandidate && onDeleteDevice) {
      onDeleteDevice(deleteCandidate.id)
      setDeleteCandidate(null)
    }
  }

  return (
    <div className="w-full mb-6 select-none animate-fade-in">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-[#00799e] flex items-center justify-center shrink-0 shadow-xs">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-xl sm:text-2xl text-slate-900 m-0 leading-tight">
              Status Konektivitas Device &amp; Gateway IoT
            </h3>
            <p className="text-xs text-slate-500 m-0 mt-0.5 font-normal">
              Pemantauan koneksi perangkat keras &amp; heartbeat telemetri MQTT real-time
            </p>
          </div>
        </div>

        {/* Add Gateway IoT Button */}
        {onOpenAddDevice && (
          <button
            onClick={onOpenAddDevice}
            className="px-4 py-2 rounded-xl bg-[#00799e] hover:bg-[#006887] active:scale-95 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm shadow-[#00799e]/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Gateway IoT</span>
          </button>
        )}
      </div>

      {/* Gateway Cards Grid (Full Width, Direct Cards) */}
      {gateways.length === 0 ? (
        <div className="py-10 text-center bg-white border border-slate-200 rounded-2xl p-6 text-slate-400">
          <Server className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-sm text-slate-700 m-0">Belum Ada Gateway IoT Terdaftar</p>
          <span className="text-xs text-slate-500 font-normal mb-4 block">
            Daftarkan gateway IoT baru untuk memulai ingestion telemetri sensor.
          </span>
          {onOpenAddDevice && (
            <button
              onClick={onOpenAddDevice}
              className="px-4 py-2 rounded-xl bg-[#00799e] hover:bg-[#006887] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Gateway Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
          {gateways.map((gw) => (
            <article
              key={gw.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Card Header Top */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-[#00799e] flex items-center justify-center shrink-0 shadow-xs">
                      <Cpu className="w-6 h-6 text-[#00799e]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-semibold text-xl sm:text-2xl text-slate-900 m-0 leading-none">
                          {gw.code}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {gw.siteId}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm text-slate-500 font-medium block mt-1">
                        {gw.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold shadow-2xs inline-flex items-center shrink-0 ${
                        gw.status === 'ONLINE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : gw.status === 'STALE'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {gw.status}
                    </span>

                    {onDeleteDevice && (
                      <button
                        onClick={() => setDeleteCandidate(gw)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={`Hapus gateway ${gw.code}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 4-Block Metadata Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
                  {/* 1. IP Address */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Network className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px] font-semibold text-slate-500">IP Address</span>
                    </div>
                    <span className="font-mono font-semibold text-xs sm:text-sm text-slate-900 block truncate">
                      {gw.ip}
                    </span>
                  </div>

                  {/* 2. Signal RSSI */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[11px] font-semibold text-slate-500">Sinyal</span>
                    </div>
                    <span className="font-mono font-semibold text-xs sm:text-sm text-emerald-600 block">
                      {gw.rssi} dBm
                    </span>
                  </div>

                  {/* 3. Firmware */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Radio className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px] font-semibold text-slate-500">Firmware</span>
                    </div>
                    <span className="font-mono font-semibold text-xs sm:text-sm text-slate-800 block">
                      {gw.firmware}
                    </span>
                  </div>

                  {/* 4. Heartbeat */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px] font-semibold text-slate-500">Heartbeat</span>
                    </div>
                    <span className="font-mono font-semibold text-xs sm:text-sm text-slate-700 block truncate">
                      {gw.lastSeen}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: MQTT Topic */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-mono text-[11px] text-slate-600 truncate">
                  Topic: swpm/v1/{gw.siteId.toLowerCase().replace(/\s+/g, '_')}/{gw.code.toLowerCase()}/telemetry
                </span>
                <span className="font-medium text-[11px] text-slate-600">
                  MQTT QoS 1 · Ingestion Active
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeleteCandidate(null)
            }}
          >
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-5 flex flex-col gap-3.5">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-base text-slate-900 m-0">
                    Hapus Gateway IoT
                  </h4>
                  <p className="text-xs text-slate-500 m-0 font-normal">
                    Konfirmasi penghapusan perangkat dari sistem
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-normal">Kode Gateway:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {deleteCandidate.code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-normal">Nama Gateway:</span>
                  <span className="font-medium text-slate-900">
                    {deleteCandidate.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-normal">IP Address:</span>
                  <span className="font-mono text-slate-700">
                    {deleteCandidate.ip}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 m-0 leading-relaxed font-normal">
                Apakah Anda yakin ingin menghapus gateway ini? Seluruh ingestion telemetri dari perangkat ini akan dihentikan.
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
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  Ya, Hapus Gateway
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
