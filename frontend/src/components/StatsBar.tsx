import React from 'react'
import type { SimulationStats } from '../types/pump'
import { AlertOctagon, CheckCircle2 } from 'lucide-react'

interface StatsBarProps {
  stats: SimulationStats
  onAlarmClick?: () => void
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, onAlarmClick }) => {
  return (
    <section className="grid grid-cols-2 md:grid-cols-5 bg-white rounded-2xl mb-5 overflow-hidden divide-x divide-y md:divide-y-0 divide-slate-100 shadow-xs">
      {/* 1. Area / Room Coverage */}
      <div className="p-3.5 sm:px-4 sm:py-3.5">
        <small className="block text-xs font-semibold text-slate-500 mb-1">
          Monitored Stations
        </small>
        <div className="flex items-baseline gap-1.5">
          <b className="font-heading font-extrabold text-2xl sm:text-[26px] tabular-nums text-slate-900">
            {stats.totalAreas}
          </b>
          <span className="text-xs font-medium text-slate-500">Stations</span>
        </div>
      </div>

      {/* 2. IoT Gateways */}
      <div className="p-3.5 sm:px-4 sm:py-3.5">
        <small className="block text-xs font-semibold text-slate-500 mb-1 flex items-center justify-between">
          <span>IoT Gateways</span>
          <span className={`w-2 h-2 rounded-full ${stats.onlineDevices > 0 ? 'bg-emerald-600' : 'bg-slate-300'}`} />
        </small>
        <div className="flex items-baseline gap-1.5">
          <b className="font-heading font-extrabold text-2xl sm:text-[26px] tabular-nums text-slate-900">
            {stats.onlineDevices}
          </b>
          <span className="text-xs font-medium text-slate-500 font-semibold">
            / {stats.totalDevices} Online
          </span>
        </div>
      </div>

      {/* 3. Pump Running Count */}
      <div className="p-3.5 sm:px-4 sm:py-3.5">
        <small className="block text-xs font-semibold text-slate-500 mb-1">
          Operating Pumps
        </small>
        <div className="flex items-baseline gap-1.5">
          <b className="font-heading font-extrabold text-2xl sm:text-[26px] tabular-nums text-slate-900">
            {stats.runningPumps}
          </b>
          <span className="text-xs font-medium text-slate-500">
            / {stats.totalPumps} Installed
          </span>
        </div>
      </div>

      {/* 4. Average Pressure & Flow */}
      <div className="p-3.5 sm:px-4 sm:py-3.5">
        <small className="block text-xs font-semibold text-slate-500 mb-1">
          Avg Pressure &amp; Total Flow
        </small>
        <div className="flex items-baseline gap-1.5">
          <b className="font-heading font-extrabold text-xl sm:text-[24px] tabular-nums text-slate-900">
            {stats.avgPressure.toFixed(2)}
          </b>
          <span className="text-xs font-mono font-bold text-slate-500">bar</span>
          <span className="text-xs font-mono font-semibold text-[#00799e] ml-1">
            · {stats.totalFlow} m³/h
          </span>
        </div>
      </div>

      {/* 5. Alarms Status (Clickable) */}
      <div
        onClick={onAlarmClick}
        className="p-3.5 sm:px-4 sm:py-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <small className="block text-xs font-semibold text-slate-500 mb-1 flex items-center justify-between">
          <span>Alarm Status</span>
          {stats.activeAlarms > 0 ? (
            <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          )}
        </small>
        <div className="flex items-baseline gap-1.5">
          <b
            className={`font-heading font-extrabold text-2xl sm:text-[26px] tabular-nums ${
              stats.activeAlarms > 0 ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {stats.activeAlarms}
          </b>
          <span
            className={`text-xs font-bold ${
              stats.activeAlarms > 0 ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {stats.activeAlarms > 0 ? 'Action Required' : 'Normal'}
          </span>
        </div>
      </div>
    </section>
  )
}

