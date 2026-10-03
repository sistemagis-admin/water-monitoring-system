import React from 'react'
import type { AlarmItem } from '../types/pump'
import { AlertOctagon, CheckCircle2, ShieldAlert } from 'lucide-react'

interface AlarmsPanelProps {
  alarms: AlarmItem[]
  onAcknowledge: (alarmId: string) => void
}

export const AlarmsPanel: React.FC<AlarmsPanelProps> = ({ alarms, onAcknowledge }) => {
  const openAlarms = alarms.filter((a) => a.status === 'OPEN')

  const getSeverityBadge = (severity: AlarmItem['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-600 text-white'
      case 'HIGH':
        return 'bg-amber-600 text-white'
      case 'MEDIUM':
        return 'bg-amber-500 text-white'
      case 'LOW':
        return 'bg-blue-600 text-white'
    }
  }

  return (
    <section className="bg-white border border-slate-200 rounded-[22px] p-5 sm:p-6 shadow-xs mb-6 select-none">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 m-0 leading-tight">
              Panel Alarm &amp; Kondisi Abnormal
            </h3>
            <span className="text-xs text-slate-500">
              Evaluasi rule engine otomatis real-time
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold text-white bg-red-600 shadow-2xs">
            {openAlarms.length} Alarm Aktif
          </span>
        </div>
      </div>

      {/* Alarms List */}
      {openAlarms.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center justify-center text-slate-400 bg-slate-50/70 border border-slate-100 rounded-xl">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
          <p className="font-bold text-sm text-slate-700 m-0">
            Seluruh Sistem Normal
          </p>
          <span className="text-xs text-slate-500">
            Tidak ada alarm aktif pada seluruh site &amp; pompa saat ini.
          </span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {openAlarms.map((alarm) => (
            <div
              key={alarm.id}
              className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold tracking-wider uppercase shrink-0 ${getSeverityBadge(
                    alarm.severity
                  )}`}
                >
                  {alarm.severity}
                </span>

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
                  </div>
                  <p className="text-xs text-slate-600 m-0 mt-0.5 leading-relaxed">
                    {alarm.message}
                  </p>
                </div>
              </div>

              {/* Acknowledge Button */}
              <button
                onClick={() => onAcknowledge(alarm.id)}
                className="self-end sm:self-auto px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 active:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0 flex items-center gap-1.5 active:scale-95"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Acknowledge</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
