import React from 'react'
import type { DeviceGateway } from '../types/pump'
import { Server, Wifi, Cpu } from 'lucide-react'

interface DeviceHealthTableProps {
  gateways: DeviceGateway[]
}

export const DeviceHealthTable: React.FC<DeviceHealthTableProps> = ({ gateways }) => {
  return (
    <section className="bg-white border border-slate-200 rounded-[22px] p-5 sm:p-6 shadow-xs mb-6 select-none">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--amp-teal)] text-white flex items-center justify-center shrink-0">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 m-0 leading-tight">
              Status Konektivitas Device &amp; Gateway IoT
            </h3>
            <span className="text-xs text-slate-500">
              Heartbeat &amp; status MQTT broker (PRD Bagian 22)
            </span>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-extrabold text-white bg-emerald-600 shadow-2xs">
          {gateways.filter((g) => g.status === 'ONLINE').length} / {gateways.length} Online
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm text-slate-700">
          <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Device / Gateway</th>
              <th className="py-2.5 px-3">Site / Lokasi</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">IP Address</th>
              <th className="py-2.5 px-3">Signal RSSI</th>
              <th className="py-2.5 px-3">Firmware</th>
              <th className="py-2.5 px-3 text-right">Heartbeat Terakhir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {gateways.map((gw) => (
              <tr key={gw.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-slate-400" />
                  <span>{gw.code}</span>
                  <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                    · {gw.name}
                  </span>
                </td>
                <td className="py-3 px-3 font-semibold text-slate-600">{gw.siteId}</td>
                <td className="py-3 px-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-white bg-emerald-600 shadow-2xs inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    ONLINE
                  </span>
                </td>
                <td className="py-3 px-3 font-mono text-xs text-slate-600">{gw.ip}</td>
                <td className="py-3 px-3 font-mono text-xs font-semibold text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                    {gw.rssi} dBm
                  </span>
                </td>
                <td className="py-3 px-3 font-mono text-xs text-slate-500">{gw.firmware}</td>
                <td className="py-3 px-3 text-right font-mono text-xs text-slate-500">
                  {gw.lastSeen}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
