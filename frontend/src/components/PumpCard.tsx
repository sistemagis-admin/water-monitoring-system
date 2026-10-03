import React from 'react'
import type { LocationStation } from '../types/pump'
import { PumpSceneSvg } from './PumpSceneSvg'
import { ArcGauge } from './ArcGauge'
import { Layers, Gauge, Flame, Activity } from 'lucide-react'

interface PumpCardProps {
  station: LocationStation
  stationIndex: number
  onToggleMotor: (stationIndex: number, motorIndex: 0 | 1) => void
}

const getRoomIcon = (id: string, name: string) => {
  if (id.includes('01') || name.toLowerCase().includes('basement')) {
    return <Layers className="w-4 h-4 text-white" />
  }
  if (id.includes('02') || name.toLowerCase().includes('booster')) {
    return <Gauge className="w-4 h-4 text-white" />
  }
  if (id.includes('03') || name.toLowerCase().includes('heater')) {
    return <Flame className="w-4 h-4 text-white" />
  }
  return <Activity className="w-4 h-4 text-white" />
}

const getRoomBg = (id: string, name: string) => {
  if (id.includes('01') || name.toLowerCase().includes('basement')) {
    return 'bg-[var(--amp-teal)]'
  }
  if (id.includes('02') || name.toLowerCase().includes('booster')) {
    return 'bg-[var(--amp-purple)]'
  }
  if (id.includes('03') || name.toLowerCase().includes('heater')) {
    return 'bg-[var(--amp-magenta)]'
  }
  return 'bg-slate-700'
}

export const PumpCard: React.FC<PumpCardProps> = ({
  station,
  stationIndex,
  onToggleMotor,
}) => {
  const activeMotorCount = station.motors[0] + station.motors[1]
  const isLive = station.flowRate > 1
  const flowPercent = Math.min(100, Math.max(0, (station.flowRate / 120) * 100))

  return (
    <article
      className={`bg-[var(--card)] border rounded-[22px] p-[18px] overflow-hidden transition-all shadow-xs hover:shadow-sm flex flex-col justify-between ${
        isLive ? 'border-[color-mix(in_srgb,var(--water)_45%,var(--line))] shadow-sm' : 'border-[var(--line)]'
      }`}
    >
      <div>
        {/* Card Header Top with Solid Icon Badge */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl ${getRoomBg(
                station.id,
                station.name
              )} text-white flex items-center justify-center shrink-0 shadow-xs`}
            >
              {getRoomIcon(station.id, station.name)}
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-[19px] sm:text-[21px] text-[var(--ink)] m-0 leading-tight">
                {station.name}
              </h2>
              <span className="text-xs text-[var(--mut)]">
                {station.code} · Lokasi {station.number}
              </span>
            </div>
          </div>

          <span
            className={`text-xs font-extrabold px-3 py-1 rounded-full text-white shadow-xs transition-colors duration-200 tracking-tight ${
              activeMotorCount > 0
                ? 'bg-emerald-600'
                : 'bg-slate-400'
            }`}
          >
            {activeMotorCount > 0 ? `${activeMotorCount} motor jalan` : 'Mati'}
          </span>
        </div>

        {/* Interactive SVG Pump Scene */}
        <PumpSceneSvg
          stationName={station.name}
          motors={station.motors}
          flowRate={station.flowRate}
        />

        {/* Meters (Pressure Arc & Flow Bar) */}
        <div className="grid grid-cols-2 gap-3 items-center my-2 mb-3.5">
          {/* Pressure Arc Gauge */}
          <div>
            <ArcGauge pressure={station.pressure} />
          </div>

          {/* Flow Meter Bar */}
          <div className="flex flex-col justify-center">
            <small className="block text-xs text-[var(--mut)] mb-0.5">Debit</small>
            <div className="leading-none">
              <b className="font-heading font-extrabold text-[26px] sm:text-[30px] tabular-nums text-[var(--ink)]">
                {station.flowRate.toFixed(1)}
              </b>
              <small className="text-[var(--mut)] ml-1 text-xs">L/min</small>
            </div>
            {/* Horizontal Bar */}
            <div className="h-2 rounded-[9px] bg-[var(--cas)] mt-2.5 overflow-hidden">
              <div
                className="h-full rounded-[9px] bg-[var(--water)] transition-all duration-700"
                style={{ width: `${flowPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dual Motor Switches */}
        <div className="grid grid-cols-2 gap-2.5">
          {[0, 1].map((k) => {
            const motorIdx = k as 0 | 1
            const isMotorOn = station.motors[motorIdx] === 1

            return (
              <button
                key={k}
                role="switch"
                aria-checked={isMotorOn}
                onClick={() => onToggleMotor(stationIndex, motorIdx)}
                className="font-medium text-xs sm:text-sm text-[var(--ink)] bg-[var(--cas)]/60 hover:bg-[var(--cas)] border border-[var(--line)] rounded-[14px] p-2.5 px-3 flex justify-between items-center cursor-pointer transition-all hover:border-[var(--water)]/50 focus-visible:outline-3 focus-visible:outline-[var(--water)] focus-visible:outline-offset-2 select-none"
              >
                <span>Motor {k + 1}</span>
                {/* Pill Switch */}
                <div
                  className={`w-[38px] h-[22px] rounded-full relative transition-colors duration-250 ${
                    isMotorOn ? 'bg-[var(--on)]' : 'bg-[var(--line)]'
                  }`}
                >
                  <span
                    className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all duration-250 ${
                      isMotorOn ? 'left-[19px]' : 'left-[3px]'
                    }`}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Card Footer Tag */}
      <div className="mt-3.5 text-xs text-[var(--mut)] font-mono flex items-center justify-between border-t border-[var(--line)]/50 pt-2.5">
        <span>{station.sensorTag}</span>
        <span className="text-[11px] opacity-70">Sistem Hidrolik</span>
      </div>
    </article>
  )
}
