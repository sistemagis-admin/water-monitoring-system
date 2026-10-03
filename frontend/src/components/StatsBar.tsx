import React from 'react'
import type { SimulationStats } from '../types/pump'

interface StatsBarProps {
  stats: SimulationStats
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 bg-[var(--card)] border border-[var(--line)] rounded-[18px] mb-5 overflow-hidden divide-x divide-y md:divide-y-0 divide-[var(--line)] shadow-xs">
      <div className="p-4 sm:px-5 sm:py-4">
        <small className="block text-xs sm:text-[13px] text-[var(--mut)] mb-1">
          Lokasi terpantau
        </small>
        <div className="flex items-baseline gap-1">
          <b className="font-heading font-extrabold text-2xl sm:text-[28px] tabular-nums text-[var(--ink)]">
            {stats.monitoredLocations}
          </b>
          <i className="not-italic text-xs sm:text-[13px] text-[var(--mut)]">lokasi</i>
        </div>
      </div>

      <div className="p-4 sm:px-5 sm:py-4">
        <small className="block text-xs sm:text-[13px] text-[var(--mut)] mb-1">
          Motor menyala
        </small>
        <div className="flex items-baseline gap-1">
          <b className="font-heading font-extrabold text-2xl sm:text-[28px] tabular-nums text-[var(--ink)]">
            {stats.runningMotors}
          </b>
          <i className="not-italic text-xs sm:text-[13px] text-[var(--mut)]">
            dari {stats.totalMotors}
          </i>
        </div>
      </div>

      <div className="p-4 sm:px-5 sm:py-4">
        <small className="block text-xs sm:text-[13px] text-[var(--mut)] mb-1">
          Rata-rata tekanan
        </small>
        <div className="flex items-baseline gap-1">
          <b className="font-heading font-extrabold text-2xl sm:text-[28px] tabular-nums text-[var(--ink)]">
            {stats.avgPressure.toFixed(2)}
          </b>
          <i className="not-italic text-xs sm:text-[13px] text-[var(--mut)]">bar</i>
        </div>
      </div>

      <div className="p-4 sm:px-5 sm:py-4">
        <small className="block text-xs sm:text-[13px] text-[var(--mut)] mb-1">
          Pembaruan terakhir
        </small>
        <div className="flex items-baseline">
          <b className="font-heading font-extrabold text-xl sm:text-[26px] tabular-nums text-[var(--ink)] font-mono">
            {stats.lastUpdated}
          </b>
        </div>
      </div>
    </section>
  )
}
