import React, { useState } from 'react'
import type { AlarmItem } from '../types/pump'
import { AlertOctagon, CheckCircle2, ShieldAlert, CheckCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AlarmsPanelProps {
  alarms: AlarmItem[]
  onAcknowledge: (alarmId: string) => void
}

export const AlarmsPanel: React.FC<AlarmsPanelProps> = ({ alarms, onAcknowledge }) => {
  const [filterStatus, setFilterStatus] = useState<'OPEN' | 'ACKNOWLEDGED' | 'ALL'>('OPEN')

  const filteredAlarms = alarms.filter((a) => {
    if (filterStatus === 'ALL') return true
    return a.status === filterStatus
  })

  const openAlarmsCount = alarms.filter((a) => a.status === 'OPEN').length

  const getSeverityBadge = (severity: AlarmItem['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-600 text-white hover:bg-red-600'
      case 'HIGH':
        return 'bg-amber-600 text-white hover:bg-amber-600'
      case 'MEDIUM':
        return 'bg-amber-500 text-white hover:bg-amber-500'
      case 'LOW':
        return 'bg-[#00799e] text-white hover:bg-[#00799e]'
    }
  }

  return (
    <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs mb-6 select-none">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-slate-900 text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
            <AlertOctagon className="size-4" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900 m-0 leading-tight">
              Active Alarms &amp; Alerts
            </h3>
            <span className="text-xs text-slate-500 font-normal">
              Real-time automated trip and threshold evaluation
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Buttons */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg">
            <button
              onClick={() => setFilterStatus('OPEN')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors duration-150 ease-out active:scale-[0.975] cursor-pointer ${
                filterStatus === 'OPEN'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({openAlarmsCount})
            </button>
            <button
              onClick={() => setFilterStatus('ACKNOWLEDGED')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors duration-150 ease-out active:scale-[0.975] cursor-pointer ${
                filterStatus === 'ACKNOWLEDGED'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Acknowledged
            </button>
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors duration-150 ease-out active:scale-[0.975] cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({alarms.length})
            </button>
          </div>
        </div>
      </div>

      {/* Alarms List */}
      {filteredAlarms.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center justify-center text-slate-400 bg-slate-50/70 border border-slate-100 rounded-xl">
          <CheckCircle2 className="size-8 text-emerald-600 mb-2" />
          <p className="font-semibold text-sm text-slate-700 m-0">
            {filterStatus === 'OPEN'
              ? 'All Systems Normal'
              : 'No alarms found for this filter'}
          </p>
          <span className="text-xs text-slate-500 mt-1">
            {filterStatus === 'OPEN'
              ? 'No active alarms across any plant stations or pumps.'
              : 'Select another filter to view historical records.'}
          </span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredAlarms.map((alarm) => (
            <div
              key={alarm.id}
              className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                alarm.status === 'OPEN'
                  ? 'bg-rose-50/40 border-rose-200/80'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <Badge
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase shrink-0 border-0 ${getSeverityBadge(
                    alarm.severity
                  )}`}
                >
                  {alarm.severity}
                </Badge>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {alarm.assetName}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-semibold text-slate-600">
                      {alarm.areaName}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      ({alarm.openedAt})
                    </span>
                    {alarm.status === 'ACKNOWLEDGED' && (
                      <Badge variant="outline" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border-amber-200">
                        <CheckCheck className="size-3" />
                        Acknowledged {alarm.acknowledgedBy ? `(${alarm.acknowledgedBy})` : ''}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 m-0 mt-0.5 leading-relaxed">
                    {alarm.message}
                  </p>
                </div>
              </div>

              {/* Acknowledge Button */}
              {alarm.status === 'OPEN' && (
                <Button
                  onClick={() => onAcknowledge(alarm.id)}
                  size="sm"
                  className="self-end sm:self-auto bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors duration-150 ease-out active:scale-[0.975] cursor-pointer shadow-2xs shrink-0 flex items-center gap-1.5"
                >
                  <ShieldAlert className="size-3.5 text-amber-400" />
                  <span>Acknowledge</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
