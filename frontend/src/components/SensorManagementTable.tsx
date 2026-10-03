import React from 'react'
import type { SensorItem } from '../types/pump'
import { Radio, Plus, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react'

interface SensorManagementTableProps {
  sensors: SensorItem[]
  onOpenAddSensor: () => void
  onDeleteSensor: (id: string) => void
}

export const SensorManagementTable: React.FC<SensorManagementTableProps> = ({
  sensors,
  onOpenAddSensor,
  onDeleteSensor,
}) => {
  const getSensorTypeBadge = (type: SensorItem['sensorType']) => {
    switch (type) {
      case 'PRESSURE_SENSOR':
        return 'bg-blue-600 text-white'
      case 'FLOW_METER':
        return 'bg-emerald-600 text-white'
      case 'LEVEL_SENSOR':
      case 'DISTANCE_SENSOR':
        return 'bg-cyan-600 text-white'
      case 'TEMPERATURE_SENSOR':
        return 'bg-amber-600 text-white'
      case 'CURRENT_SENSOR':
        return 'bg-purple-600 text-white'
      case 'VIBRATION_SENSOR':
        return 'bg-rose-600 text-white'
      default:
        return 'bg-slate-600 text-white'
    }
  }

  return (
    <section className="bg-white border border-slate-200 rounded-[22px] p-5 sm:p-6 shadow-xs mb-6 select-none">
      {/* Table Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--amp-magenta)] text-white flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 m-0 leading-tight">
              Daftar Sensor &amp; Instrumentasi Lapangan
            </h3>
            <span className="text-xs text-slate-500">
              Sensor binding terhubung ke Room / Pompa (PRD 24.10 &amp; 24.11)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddSensor}
            className="px-3.5 py-1.5 rounded-xl bg-[var(--amp-magenta)] hover:opacity-90 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Sensor</span>
          </button>
        </div>
      </div>

      {/* Sensor Table */}
      {sensors.length === 0 ? (
        <div className="py-10 text-center flex flex-col items-center justify-center text-slate-400 bg-slate-50/70 border border-slate-100 rounded-xl">
          <Radio className="w-8 h-8 text-slate-300 mb-2" />
          <p className="font-bold text-sm text-slate-700 m-0">Belum Ada Sensor Terdaftar</p>
          <span className="text-xs text-slate-500">
            Klik tombol &quot;Tambah Sensor&quot; di atas untuk menghubungkan instrumentasi baru.
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Kode / Tag</th>
                <th className="py-2.5 px-3">Nama Instrument</th>
                <th className="py-2.5 px-3">Tipe Sensor</th>
                <th className="py-2.5 px-3">Binding Terkait</th>
                <th className="py-2.5 px-3">Nilai Live</th>
                <th className="py-2.5 px-3">Ambang Normal</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sensors.map((sensor) => {
                const isAbnormal =
                  (sensor.minThreshold !== undefined && sensor.currentValue < sensor.minThreshold) ||
                  (sensor.maxThreshold !== undefined && sensor.currentValue > sensor.maxThreshold)

                return (
                  <tr key={sensor.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {sensor.code}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {sensor.name}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${getSensorTypeBadge(
                          sensor.sensorType
                        )}`}
                      >
                        {sensor.sensorType.replace('_SENSOR', '').replace('_METER', '')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-700">
                          {sensor.targetName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-500">
                          {sensor.targetType}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span
                        className={`font-extrabold text-sm tabular-nums ${
                          isAbnormal ? 'text-red-600' : 'text-slate-900'
                        }`}
                      >
                        {sensor.currentValue} {sensor.unit}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-500">
                      {sensor.minThreshold !== undefined && sensor.maxThreshold !== undefined
                        ? `${sensor.minThreshold} - ${sensor.maxThreshold} ${sensor.unit}`
                        : '-'}
                    </td>
                    <td className="py-3 px-3">
                      {isAbnormal ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white bg-red-600 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          ABNORMAL
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white bg-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          NORMAL
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onDeleteSensor(sensor.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Hapus Sensor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
