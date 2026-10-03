import React from 'react'
import type { LocationStation } from '../types/pump'
import { PumpSceneSvg } from './PumpSceneSvg'
import { ArcGauge } from './ArcGauge'

interface PumpCardProps {
  station: LocationStation
  stationIndex: number
  onToggleMotor: (stationIndex: number, motorIndex: 0 | 1) => void
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
      className={`bg-[var(--card)] border rounded-[22px] p-[18px] overflow-hidden transition-all shadow-xs flex flex-col justify-between ${
        isLive ? 'border-[color-mix(in_srgb,var(--water)_45%,var(--line))] shadow-md' : 'border-[var(--line)]'
      }`}
    >
      <div>
        {/* Card Header Top */}
        <div className="flex justify-between items-center mb-1">
          <div>
            <h2 className="font-heading font-extrabold text-[21px] text-[var(--ink)] m-0 leading-tight">
              {station.name}
            </h2>
            <span className="text-xs text-[var(--mut)]">
              {station.code} · Lokasi {station.number}
            </span>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
              activeMotorCount > 0
                ? 'bg-[color-mix(in_srgb,var(--on)_18%,transparent)] text-[var(--on)]'
                : 'bg-[var(--cas)] text-[var(--mut)]'
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
                className="font-medium text-xs sm:text-sm text-[var(--ink)] bg-[var(--bg)] border border-[var(--line)] rounded-[14px] p-2.5 px-3 flex justify-between items-center cursor-pointer transition-all hover:border-[var(--water)]/50 focus-visible:outline-3 focus-visible:outline-[var(--water)] focus-visible:outline-offset-2 select-none"
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
