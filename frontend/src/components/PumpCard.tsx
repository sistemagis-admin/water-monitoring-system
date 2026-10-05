import React from 'react'
import type { LocationStation } from '../types/pump'
import {
  Gauge,
  Droplets,
  Plus,
  Radio,
} from 'lucide-react'

interface PumpCardProps {
  station: LocationStation
  stationIndex: number
  onToggleMotor: (pumpId: string) => void
  onOpenAddPump?: (areaId: string) => void
}

export const PumpCard: React.FC<PumpCardProps> = ({
  station,
  stationIndex,
  onToggleMotor,
  onOpenAddPump,
}) => {
  const activePumps = station.pumps.filter((p) => p.status === 'RUNNING')
  const isRunning = activePumps.length > 0
  const hasPumps = station.pumps.length > 0

  return (
    <article
      className={`bg-white border rounded-[22px] p-5 transition-all shadow-xs hover:shadow-sm flex flex-col justify-between ${
        isRunning
          ? 'border-emerald-400 ring-2 ring-emerald-400/10'
          : 'border-slate-200'
      }`}
    >
      <div>
        {/* Card Header: Icon, Room Name, and Operational Status Pill */}
        <div className="flex justify-between items-start gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs font-extrabold text-xs">
              {station.number || `0${stationIndex + 1}`}
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-slate-900 m-0 leading-tight">
                {station.name}
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {station.code} · Stasiun {station.number}
              </span>
            </div>
          </div>

          <span
            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs ${
              !hasPumps
                ? 'bg-slate-100 text-slate-500'
                : isRunning
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            {!hasPumps ? 'Kosong' : isRunning ? `${activePumps.length} Aktif` : 'Standby'}
          </span>
        </div>

        {/* Live Hydraulic Telemetry Bar (Pressure & Flow) */}
        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-50 border border-slate-100 rounded-xl">
          {/* Pressure Metric */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Gauge className="w-3 h-3 text-[#00799e]" />
              Tekanan
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-heading font-extrabold text-xl text-slate-900 tabular-nums">
                {station.pressure.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500 font-semibold">bar</span>
            </div>
          </div>

          {/* Flow Metric */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Droplets className="w-3 h-3 text-cyan-600" />
              Debit Aliran
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-heading font-extrabold text-xl text-slate-900 tabular-nums">
                {station.flowRate.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 font-semibold">m³/h</span>
            </div>
          </div>
        </div>

        {/* Pumps List inside this Room */}
        {!hasPumps ? (
          <div className="py-6 text-center flex flex-col items-center justify-center bg-slate-50/50 border border-dashed border-slate-200 rounded-xl mb-4">
            <span className="text-xs font-semibold text-slate-500 mb-2">
              Belum ada pompa di stasiun ini
            </span>
            {onOpenAddPump && (
              <button
                type="button"
                onClick={() => onOpenAddPump(station.id)}
                className="px-3 py-1.5 rounded-lg bg-[var(--amp-teal)] text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Pasang Pompa</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5 mb-4">
            {station.pumps.map((pump) => {
              const pumpRunning = pump.status === 'RUNNING'

              return (
                <div
                  key={pump.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    pumpRunning
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        pumpRunning ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {pump.code}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                          {pump.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>{pump.metrics.power_kw.toFixed(1)} kW</span>
                        <span>•</span>
                        <span>{pump.metrics.motor_temp_c.toFixed(0)}°C</span>
                      </div>
                    </div>
                  </div>

                  {/* Switch toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={pumpRunning}
                    onClick={() => onToggleMotor(pump.id)}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer inline-flex items-center px-0.5 shrink-0 ${
                      pumpRunning ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                    title={`Klik untuk ${pumpRunning ? 'Matikan' : 'Nyalakan'} ${pump.name}`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 transform ${
                        pumpRunning ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Card Footer Tag */}
      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Radio className="w-3 h-3 text-slate-400" />
          {station.sensorTag || 'TELEMETRY-OK'}
        </span>
        <span className="font-semibold text-slate-500">Telemetry Online</span>
      </div>
    </article>
  )
}
