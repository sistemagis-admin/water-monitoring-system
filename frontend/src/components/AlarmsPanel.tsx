import React, { useState } from 'react'
import type { AlarmItem } from '../types/pump'
import { AlertOctagon, CheckCircle2, ShieldAlert, CheckCheck } from 'lucide-react'

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
        return 'bg-red-600 text-white'
      case 'HIGH':
        return 'bg-amber-600 text-white'
      case 'MEDIUM':
        return 'bg-amber-500 text-white'
      case 'LOW':
        return 'bg-[#00799e] text-white'
    }
  }

  return (
    <section className="bg-white border border-slate-200 rounded-[22px] p-5 sm:p-6 shadow-xs mb-6 select-none">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-lg sm:text-xl text-slate-900 m-0 leading-tight">
              Panel Alarm &amp; Kondisi Abnormal
            </h3>
            <span className="text-xs text-slate-500 font-normal">
              Evaluasi rule engine otomatis real-time Fastify Backend
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Buttons */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setFilterStatus('OPEN')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                filterStatus === 'OPEN'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aktif ({openAlarmsCount})
            </button>
            <button
              onClick={() => setFilterStatus('ACKNOWLEDGED')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                filterStatus === 'ACKNOWLEDGED'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Diakui
            </button>
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({alarms.length})
            </button>
          </div>
        </div>
      </div>

      {/* Alarms List */}
      {filteredAlarms.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center justify-center text-slate-400 bg-slate-50/70 border border-slate-100 rounded-xl">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
          <p className="font-bold text-sm text-slate-700 m-0">
            {filterStatus === 'OPEN'
              ? 'Seluruh Sistem Normal'
              : 'Tidak ada data alarm untuk filter ini'}
          </p>
          <span className="text-xs text-slate-500">
            {filterStatus === 'OPEN'
              ? 'Tidak ada alarm aktif pada seluruh site & pompa saat ini.'
              : 'Silakan ubah filter status untuk melihat riwayat alarm lain.'}
          </span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredAlarms.map((alarm) => (
            <div
              key={alarm.id}
              className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                alarm.status === 'OPEN'
                  ? 'bg-red-50/30 border-red-200/80'
                  : 'bg-slate-50 border-slate-200'
              }`}
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
                    {alarm.status === 'ACKNOWLEDGED' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                        <CheckCheck className="w-3 h-3" />
                        Diakui {alarm.acknowledgedBy ? `(${alarm.acknowledgedBy})` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 m-0 mt-0.5 leading-relaxed">
                    {alarm.message}
                  </p>
                </div>
              </div>

              {/* Acknowledge Button */}
              {alarm.status === 'OPEN' && (
                <button
                  onClick={() => onAcknowledge(alarm.id)}
                  className="self-end sm:self-auto px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 active:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0 flex items-center gap-1.5 active:scale-95"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Acknowledge</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
