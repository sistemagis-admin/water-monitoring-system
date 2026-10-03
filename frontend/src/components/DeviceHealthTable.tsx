import React from 'react'
import type { DeviceGateway } from '../types/pump'
import { Server, Wifi, Cpu, Clock, Network, Radio } from 'lucide-react'

interface DeviceHealthTableProps {
  gateways: DeviceGateway[]
}

export const DeviceHealthTable: React.FC<DeviceHealthTableProps> = ({ gateways }) => {
  return (
    <div className="w-full mb-6 select-none">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--amp-teal)] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 m-0 leading-tight">
              Status Konektivitas Device &amp; Gateway IoT
            </h3>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              Pemantauan koneksi perangkat keras &amp; heartbeat telemetri MQTT real-time
            </p>
          </div>
        </div>

        <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold text-white bg-emerald-600 shadow-2xs flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>{gateways.filter((g) => g.status === 'ONLINE').length} / {gateways.length} Gateway Online</span>
        </span>
      </div>

      {/* Gateway Cards Grid (Full Width, Direct Cards) */}
      {gateways.length === 0 ? (
        <div className="py-10 text-center bg-white border border-slate-200 rounded-[22px] p-6 text-slate-400">
          <Server className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-sm text-slate-700 m-0">Belum Ada Gateway IoT Terdaftar</p>
          <span className="text-xs text-slate-500">Gateway akan muncul saat terkoneksi dengan database backend.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
          {gateways.map((gw) => (
            <article
              key={gw.id}
              className="bg-white border border-slate-200 rounded-[22px] p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Card Header Top */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Cpu className="w-6 h-6 text-[var(--amp-teal)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 m-0 leading-none">
                          {gw.code}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-slate-100 text-slate-700">
                          {gw.siteId}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm text-slate-500 font-medium block mt-1">
                        {gw.name}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold text-white shadow-2xs inline-flex items-center gap-1.5 shrink-0 ${
                      gw.status === 'ONLINE' ? 'bg-emerald-600' : gw.status === 'STALE' ? 'bg-amber-600' : 'bg-red-600'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {gw.status}
                  </span>
                </div>

                {/* 4-Block Metadata Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
                  {/* 1. IP Address */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Network className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px] font-bold text-slate-500">IP Address</span>
                    </div>
                    <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 block truncate">
                      {gw.ip}
                    </span>
                  </div>

                  {/* 2. Signal RSSI */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[11px] font-bold text-slate-500">Sinyal</span>
                    </div>
                    <span className="font-mono font-bold text-xs sm:text-sm text-emerald-600 block">
                      {gw.rssi} dBm
                    </span>
                  </div>

                  {/* 3. Firmware */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Radio className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px] font-bold text-slate-500">Firmware</span>
                    </div>
                    <span className="font-mono font-bold text-xs sm:text-sm text-slate-800 block">
                      {gw.firmware}
                    </span>
                  </div>

                  {/* 4. Heartbeat */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px] font-bold text-slate-500">Heartbeat</span>
                    </div>
                    <span className="font-mono font-bold text-xs sm:text-sm text-slate-700 block truncate">
                      {gw.lastSeen}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: MQTT Topic */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-mono text-[11px] text-slate-600 truncate">
                  Topic: swpm/v1/{gw.siteId.toLowerCase()}/{gw.code.toLowerCase()}/telemetry
                </span>
                <span className="font-bold text-[11px] text-slate-600">
                  MQTT QoS 1 · Ingestion Active
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
