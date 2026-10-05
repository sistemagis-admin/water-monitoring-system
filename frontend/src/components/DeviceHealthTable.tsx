import React, { useState } from 'react'
import type { AreaRoom, DeviceGateway } from '../types/pump'
import { Server, Wifi, Cpu, Clock, Network, Plus, Trash2, Copy, Check, Activity } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { cn } from 'cn'

interface DeviceHealthTableProps {
  gateways: DeviceGateway[]
  rooms?: AreaRoom[]
  onOpenAddDevice?: () => void
  onDeleteDevice?: (id: string) => void
}

export const DeviceHealthTable: React.FC<DeviceHealthTableProps> = ({
  gateways,
  rooms = [],
  onOpenAddDevice,
  onDeleteDevice,
}) => {
  const [deleteCandidate, setDeleteCandidate] = useState<DeviceGateway | null>(null)
  const [copiedTopic, setCopiedTopic] = useState<string | null>(null)

  const handleConfirmDelete = () => {
    if (deleteCandidate && onDeleteDevice) {
      onDeleteDevice(deleteCandidate.id)
      setDeleteCandidate(null)
    }
  }

  const handleCopy = (topic: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(topic)
      setCopiedTopic(topic)
      setTimeout(() => setCopiedTopic(null), 2000)
    }
  }

  const getConnectedPumps = (gwCode: string) => {
    if (!rooms || rooms.length === 0) return []
    const allPumps = rooms.flatMap((r) => r.pumps)
    if (gwCode.toLowerCase().includes('002')) {
      return allPumps.filter((p) => p.code.startsWith('P-2') || p.name.toLowerCase().includes('booster'))
    }
    return allPumps.filter((p) => !p.code.startsWith('P-2') && !p.name.toLowerCase().includes('booster'))
  }

  return (
    <div className="w-full mb-6 select-none animate-fade-in">
      {/* 1. Gateway Toolbar & Metrics Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-lg text-slate-900 m-0">
              IoT Edge Gateways & Telemetry Nodes
            </h3>
            <Badge variant="outline" className="font-mono text-[10px] font-semibold text-slate-600 bg-slate-100 border-slate-200">
              FIELD BUS
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 m-0">
            Node telemetri pengumpul data sensor & transmisi kendali PLC melalui protokol MQTT.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 text-xs font-mono text-slate-600 shadow-2xs">
            <span className="text-slate-400 font-medium">STATUS:</span>
            <span className="font-bold text-slate-800">{gateways.length} NODES</span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
              <span className="size-1.5 rounded-full bg-emerald-500"></span>
              {gateways.filter((g) => g.status === 'ONLINE').length} ONLINE
            </span>
          </div>

          {onOpenAddDevice && (
            <Button
              type="button"
              size="sm"
              onClick={onOpenAddDevice}
              className="bg-[#00799e] hover:bg-[#006887] text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs rounded-lg cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Tambah Gateway</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Gateway Cards Grid */}
      {gateways.length === 0 ? (
        <div className="bg-white rounded-2xl py-12 text-center p-6 text-slate-400 flex flex-col items-center justify-center border border-slate-200/80 shadow-xs">
          <div className="size-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <Server className="size-6" />
          </div>
          <p className="font-heading font-semibold text-base text-slate-800 m-0">
            Belum Ada IoT Gateway Terdaftar
          </p>
          <span className="text-xs text-slate-500 font-normal my-2 block max-w-sm">
            Daftarkan node gateway telemetri baru untuk mulai menghubungkan transmisi sinyal sensor pompa ke sistem.
          </span>
          {onOpenAddDevice && (
            <Button
              type="button"
              size="sm"
              onClick={onOpenAddDevice}
              className="mt-2 bg-[#00799e] hover:bg-[#006887] text-white text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 rounded-xl cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Tambah Gateway Pertama</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {gateways.map((gw) => {
            const isOnline = gw.status === 'ONLINE'
            const isStale = gw.status === 'STALE'
            const connectedPumps = getConnectedPumps(gw.code)
            const topicStr = `swpm/v1/${gw.siteId.toLowerCase().replace(/\s+/g, '_')}/${gw.code.toLowerCase()}/telemetry`
            const isCopied = copiedTopic === topicStr

            return (
              <article
                key={gw.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between h-full relative"
              >
                <div>
                  {/* Card Header: Device Identity & Status Badge (Perfect Optical Alignment) */}
                  <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                    {/* Left Identity Block */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
                        <Server className="size-5 text-slate-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-mono font-bold text-base text-slate-900 m-0 leading-none">
                            {gw.code}
                          </h4>
                          <span
                            className="font-mono text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60 uppercase tracking-wider truncate max-w-[130px]"
                            title={gw.siteId}
                          >
                            {gw.siteId}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium block truncate mt-1">
                          {gw.name}
                        </span>
                      </div>
                    </div>

                    {/* Right Status Block - Optical Center Centering */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider border select-none uppercase",
                          isOnline
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/90"
                            : isStale
                            ? "bg-amber-50 text-amber-700 border-amber-200/90"
                            : "bg-rose-50 text-rose-700 border-rose-200/90"
                        )}
                      >
                        <span className="relative flex size-2 items-center justify-center shrink-0">
                          {isOnline && (
                            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                          )}
                          <span
                            className={cn(
                              "relative inline-flex size-1.5 rounded-full shrink-0",
                              isOnline ? "bg-emerald-600" : isStale ? "bg-amber-500" : "bg-rose-500"
                            )}
                          />
                        </span>
                        <span>{gw.status}</span>
                      </div>

                      {onDeleteDevice && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteCandidate(gw)}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title={`Hapus gateway ${gw.code}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Telemetry & Hardware Matrix 4-Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5">
                    {/* 1. IP Address */}
                    <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <Network className="size-3 text-slate-500 shrink-0" />
                        <span className="text-[9px] font-mono uppercase tracking-wider font-semibold text-slate-500 truncate">
                          IP Address
                        </span>
                      </div>
                      <span className="font-mono font-bold text-xs text-slate-900 block truncate">
                        {gw.ip}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        Static IPv4
                      </span>
                    </div>

                    {/* 2. Signal RSSI */}
                    <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <Wifi className="size-3 text-emerald-600 shrink-0" />
                        <span className="text-[9px] font-mono uppercase tracking-wider font-semibold text-slate-500 truncate">
                          Signal RSSI
                        </span>
                      </div>
                      <span className="font-mono font-bold text-xs text-emerald-700 block tabular-nums">
                        {gw.rssi} dBm
                      </span>
                      <span className="text-[10px] text-emerald-600 font-mono block mt-0.5">
                        Sangat Baik
                      </span>
                    </div>

                    {/* 3. Firmware */}
                    <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <Cpu className="size-3 text-slate-500 shrink-0" />
                        <span className="text-[9px] font-mono uppercase tracking-wider font-semibold text-slate-500 truncate">
                          Firmware
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-xs text-slate-800 block truncate">
                        {gw.firmware}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        Linux ARM64
                      </span>
                    </div>

                    {/* 4. Heartbeat */}
                    <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <Clock className="size-3 text-slate-500 shrink-0" />
                        <span className="text-[9px] font-mono uppercase tracking-wider font-semibold text-slate-500 truncate">
                          Heartbeat
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-xs text-slate-700 block truncate">
                        {gw.lastSeen}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        Setiap 10s
                      </span>
                    </div>
                  </div>

                  {/* Connected Field Equipment Strip */}
                  {connectedPumps.length > 0 && (
                    <div className="py-2.5 px-3 rounded-xl bg-slate-50/60 border border-slate-100/90 mb-3.5 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                        <Activity className="size-3.5 text-slate-400" />
                        <span className="text-[11px] font-medium text-slate-600">
                          Pompa Terhubung ({connectedPumps.length}):
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {connectedPumps.map((pump) => {
                          const isPumpRunning = pump.status === 'RUNNING'
                          return (
                            <span
                              key={pump.id}
                              className={cn(
                                "font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 select-none",
                                isPumpRunning
                                  ? "bg-emerald-50/90 text-emerald-800 border-emerald-200/80"
                                  : "bg-white text-slate-600 border-slate-200/80"
                              )}
                              title={`${pump.name} (${pump.status})`}
                            >
                              <span
                                className={cn(
                                  "size-1.5 rounded-full shrink-0",
                                  isPumpRunning ? "bg-emerald-500" : "bg-slate-400"
                                )}
                              />
                              {pump.code}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: MQTT Channel & Copy Link */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] min-w-0 max-w-full sm:max-w-[70%]">
                    <span className="text-slate-400 font-semibold text-[10px]">TOPIC:</span>
                    <span className="text-slate-700 font-medium truncate select-all">
                      {topicStr}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(topicStr)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer shrink-0"
                      title={isCopied ? "Tersalin!" : "Salin MQTT Topic"}
                    >
                      {isCopied ? (
                        <Check className="size-3 text-emerald-600" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[10px] font-medium text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded border border-slate-200/60">
                      MQTT QoS 1 · Subscribed
                    </span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal using shadcn AlertDialog */}
      <AlertDialog
        open={deleteCandidate !== null}
        onOpenChange={(open) => !open && setDeleteCandidate(null)}
      >
        <AlertDialogContent className="sm:max-w-md bg-white border-0 rounded-2xl shadow-xl p-6">
          <AlertDialogHeader className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="size-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="size-5" />
              </div>
              <div>
                <AlertDialogTitle className="font-heading font-semibold text-base text-slate-900 m-0">
                  Hapus IoT Gateway
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-slate-500 m-0 font-normal mt-0.5">
                  Konfirmasi pencopotan node gateway dari jaringan telemetri
                </AlertDialogDescription>
              </div>
            </div>

            {deleteCandidate && (
              <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1.5">
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
            )}

            <p className="text-xs text-slate-600 m-0 leading-relaxed font-normal">
              Apakah Anda yakin ingin menghapus gateway ini? Seluruh transmisi telemetri sensor yang terhubung ke node ini akan terputus.
            </p>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <AlertDialogCancel asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteCandidate(null)}
                className="text-xs font-medium text-slate-600 cursor-pointer"
              >
                Batal
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                className="text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer"
              >
                Hapus Gateway
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
