import React, { useState } from 'react'
import type { DeviceGateway } from '../types/pump'
import { Server, Wifi, Cpu, Clock, Network, Radio, Plus, Trash2 } from 'lucide-react'
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
      {/* 1. Gateway Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-slate-900 text-white font-mono text-xs px-3 py-1.5 flex items-center gap-2 shadow-xs">
            <span className="size-2 rounded-full bg-emerald-400 led-pulse-emerald"></span>
            <span className="tracking-wider text-[11px]">IOT GATEWAYS</span>
          </Badge>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-mono shadow-2xs">
            <span className="text-slate-400">TOTAL:</span>
            <span className="font-bold text-slate-800">{gateways.length} NODES</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-600 font-bold">
              {gateways.filter((g) => g.status === 'ONLINE').length} ONLINE
            </span>
          </div>
        </div>

        {/* Add Gateway IoT Button using shadcn Button */}
        {onOpenAddDevice && (
          <Button
            type="button"
            size="sm"
            onClick={onOpenAddDevice}
            className="bg-[#00799e] hover:bg-[#006887] text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Add IoT Gateway</span>
          </Button>
        )}
      </div>

      {/* Gateway Cards Grid */}
      {gateways.length === 0 ? (
        <div className="bg-white rounded-2xl py-12 text-center p-6 text-slate-400 flex flex-col items-center justify-center shadow-xs">
          <div className="size-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <Server className="size-6" />
          </div>
          <p className="font-heading font-semibold text-base text-slate-800 m-0">No IoT Gateways Registered</p>
          <span className="text-xs text-slate-500 font-normal my-2 block max-w-sm">
            Register a gateway node to begin ingesting telemetry signals over MQTT into the SCADA system.
          </span>
          {onOpenAddDevice && (
            <Button
              type="button"
              size="sm"
              onClick={onOpenAddDevice}
              className="mt-2 bg-[#00799e] hover:bg-[#006887] text-white text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 rounded-xl cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Add First Gateway</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {gateways.map((gw) => {
            const isOnline = gw.status === 'ONLINE'
            const isStale = gw.status === 'STALE'

            return (
              <article
                key={gw.id}
                className={cn(
                  "bg-white rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-[box-shadow,transform] duration-150 ease-out flex flex-col justify-between h-full relative overflow-hidden",
                  isOnline && "ring-2 ring-emerald-500/25 bg-gradient-to-b from-emerald-500/[0.03] to-white",
                  isStale && "ring-2 ring-amber-500/25 bg-gradient-to-b from-amber-500/[0.03] to-white",
                  !isOnline && !isStale && "ring-2 ring-rose-500/25 bg-gradient-to-b from-rose-500/[0.03] to-white"
                )}
              >
                <div>
                  {/* Card Header Top */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                        <Cpu className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-mono font-bold text-lg text-slate-900 m-0 leading-none">
                            {gw.code}
                          </h4>
                          <Badge variant="outline" className="font-mono text-[10px] font-semibold text-slate-600 bg-slate-100 border-0">
                            SITE: {gw.siteId}
                          </Badge>
                        </div>
                        <span className="text-xs text-slate-500 font-medium block mt-1">
                          {gw.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[10px] font-bold inline-flex items-center gap-1.5 border-0",
                          isOnline
                            ? "bg-emerald-50 text-emerald-700"
                            : isStale
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            isOnline
                              ? "bg-emerald-500 led-pulse-emerald"
                              : isStale
                              ? "bg-amber-500 led-pulse-amber"
                              : "bg-rose-500 led-pulse-rose"
                          )}
                        />
                        {gw.status}
                      </Badge>

                      {onDeleteDevice && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteCandidate(gw)}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title={`Delete gateway ${gw.code}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 4-Block SCADA Metadata Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
                    {/* 1. IP Address */}
                    <div className="p-3 rounded-xl bg-slate-50/80">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <Network className="size-3 text-slate-500" />
                        <span className="text-[9px] font-mono uppercase tracking-wider font-semibold text-slate-500">IP Address</span>
                      </div>
                      <span className="font-mono font-bold text-xs text-slate-900 block truncate">
                        {gw.ip}
                      </span>
                    </div>

                    {/* 2. Signal RSSI */}
                    <div className="p-3 rounded-xl bg-slate-50/80">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <Wifi className="size-3 text-emerald-600" />
                        <span className="text-[9px] font-mono uppercase tracking-wider font-semibold text-slate-500">Signal</span>
                      </div>
                      <span className="font-mono font-bold text-xs text-emerald-600 block tabular-nums">
                        {gw.rssi} dBm
                      </span>
                    </div>

                    {/* 3. Firmware */}
                    <div className="p-3 rounded-xl bg-slate-50/80">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <Radio className="size-3 text-slate-500" />
                        <span className="text-[9px] font-mono uppercase tracking-wider font-semibold text-slate-500">Firmware</span>
                      </div>
                      <span className="font-mono font-semibold text-xs text-slate-800 block truncate">
                        {gw.firmware}
                      </span>
                    </div>

                    {/* 4. Heartbeat */}
                    <div className="p-3 rounded-xl bg-slate-50/80">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <Clock className="size-3 text-slate-500" />
                        <span className="text-[9px] font-mono uppercase tracking-wider font-semibold text-slate-500">Heartbeat</span>
                      </div>
                      <span className="font-mono font-semibold text-xs text-slate-700 block truncate">
                        {gw.lastSeen}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: MQTT Topic */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-mono text-[10px] text-slate-500 truncate max-w-xs">
                    TOPIC: swpm/v1/{gw.siteId.toLowerCase().replace(/\s+/g, '_')}/{gw.code.toLowerCase()}/telemetry
                  </span>
                  <Badge variant="outline" className="font-mono text-[9px] font-semibold text-slate-600 bg-slate-50 border-0">
                    MQTT QoS 1 · Connected
                  </Badge>
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
                  Delete IoT Gateway
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-slate-500 m-0 font-normal mt-0.5">
                  Confirm gateway node removal from telemetry network
                </AlertDialogDescription>
              </div>
            </div>

            {deleteCandidate && (
              <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-normal">Gateway Code:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {deleteCandidate.code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-normal">Gateway Name:</span>
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
              Are you sure you want to remove this gateway? All incoming telemetry signals from this node will be disconnected.
            </p>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <AlertDialogCancel asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteCandidate(null)}
                className="text-xs font-medium text-slate-600"
              >
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                className="text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs"
              >
                Delete Gateway
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
