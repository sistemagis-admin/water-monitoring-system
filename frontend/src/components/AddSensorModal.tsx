import React, { useState, useEffect } from 'react'
import type { AreaRoom, DeviceGateway, AddSensorInput, SensorType } from '../types/pump'
import { CustomSelect, type SelectOption } from './CustomSelect'
import { Radio, X, Check, Activity, Layers, Disc } from 'lucide-react'

interface AddSensorModalProps {
  isOpen: boolean
  onClose: () => void
  onAddSensor: (payload: AddSensorInput) => void
  rooms: AreaRoom[]
  gateways: DeviceGateway[]
}

export const AddSensorModal: React.FC<AddSensorModalProps> = ({
  isOpen,
  onClose,
  onAddSensor,
  rooms,
  gateways,
}) => {
  const [code, setCode] = useState(`PT-0${Math.floor(Math.random() * 90 + 10)}`)
  const [name, setName] = useState('')
  const [sensorType, setSensorType] = useState<SensorType>('PRESSURE_SENSOR')
  const [metricCode, setMetricCode] = useState('pressure_bar')
  const [unit, setUnit] = useState('bar')
  const [targetType, setTargetType] = useState<'AREA' | 'PUMP'>('AREA')
  const [targetId, setTargetId] = useState(rooms[0]?.id || 'room-01')
  const [deviceId, setDeviceId] = useState(gateways[0]?.id || 'gw-001')
  const [minThreshold, setMinThreshold] = useState(0.5)
  const [maxThreshold, setMaxThreshold] = useState(6.0)
  const [isSuccess, setIsSuccess] = useState(false)

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  // Auto configure metric code and unit when sensor type changes
  const handleSensorTypeChange = (type: SensorType) => {
    setSensorType(type)
    switch (type) {
      case 'PRESSURE_SENSOR':
        setMetricCode('pressure_bar')
        setUnit('bar')
        setMinThreshold(0.5)
        setMaxThreshold(6.0)
        break
      case 'FLOW_METER':
        setMetricCode('flow_m3h')
        setUnit('m³/h')
        setMinThreshold(0)
        setMaxThreshold(100)
        break
      case 'LEVEL_SENSOR':
      case 'DISTANCE_SENSOR':
        setMetricCode('tank_level_pct')
        setUnit('%')
        setMinThreshold(20)
        setMaxThreshold(95)
        break
      case 'TEMPERATURE_SENSOR':
        setMetricCode('temp_c')
        setUnit('°C')
        setMinThreshold(10)
        setMaxThreshold(85)
        break
      case 'CURRENT_SENSOR':
        setMetricCode('current_a')
        setUnit('A')
        setMinThreshold(0)
        setMaxThreshold(60)
        break
      case 'VIBRATION_SENSOR':
        setMetricCode('vibration_mms')
        setUnit('mm/s')
        setMinThreshold(0)
        setMaxThreshold(5.0)
        break
      default:
        setMetricCode('custom_val')
        setUnit('val')
    }
  }

  const allPumps = rooms.flatMap((r) => r.pumps)

  const sensorTypeOptions: SelectOption[] = [
    { value: 'PRESSURE_SENSOR', label: 'Pressure (Tekanan Air)' },
    { value: 'FLOW_METER', label: 'Flow Meter (Debit Aliran)' },
    { value: 'LEVEL_SENSOR', label: 'Level Sensor (Level Tangki)' },
    { value: 'DISTANCE_SENSOR', label: 'Distance (Ultrasonik)' },
    { value: 'TEMPERATURE_SENSOR', label: 'Temperature (Suhu Air)' },
    { value: 'CURRENT_SENSOR', label: 'Current (Arus Listrik)' },
    { value: 'VIBRATION_SENSOR', label: 'Vibration (Getaran)' },
  ]

  const targetTypeOptions: SelectOption[] = [
    {
      value: 'AREA',
      label: 'Ruangan / Area',
      icon: <Layers className="w-3.5 h-3.5 text-[var(--amp-magenta)]" />,
    },
    {
      value: 'PUMP',
      label: 'Asset Pompa',
      icon: <Disc className="w-3.5 h-3.5 text-[var(--amp-magenta)]" />,
    },
  ]

  const targetObjectOptions: SelectOption[] =
    targetType === 'AREA'
      ? rooms.map((r) => ({
          value: r.id,
          label: `${r.name} (${r.number})`,
          sublabel: r.code,
        }))
      : allPumps.map((p) => ({
          value: p.id,
          label: `${p.code} · ${p.name}`,
          sublabel: p.areaName,
        }))

  const gatewayOptions: SelectOption[] = gateways.map((g) => ({
    value: g.id,
    label: `${g.code} · ${g.name.replace('Gateway Utama - ', '').replace('Gateway Distribusi - ', '')}`,
    sublabel: `IP: ${g.ip}`,
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onAddSensor({
      code: code.trim(),
      name: name.trim(),
      sensorType,
      metricCode,
      unit,
      targetType,
      targetId,
      deviceId,
      minThreshold: Number(minThreshold),
      maxThreshold: Number(maxThreshold),
    })

    setIsSuccess(true)
    setTimeout(() => {
      setIsSuccess(false)
      onClose()
    }, 800)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--amp-magenta)] text-white flex items-center justify-center shadow-xs">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-slate-900 m-0 leading-tight">
                Tambah Sensor &amp; Binding
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Konfigurasi Instrumentasi &amp; Sensor Binding
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {isSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Sensor berhasil didaftarkan dan dihubungkan!</span>
            </div>
          )}

          {/* Row 1: Code & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kode / Tag Sensor *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Contoh: PT-04 / FT-04"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:bg-white focus:border-[var(--amp-magenta)] focus:ring-1 focus:ring-[var(--amp-magenta)] outline-hidden transition-all"
              />
            </div>

            <div>
              <CustomSelect
                label="Tipe Instrumentasi Sensor"
                options={sensorTypeOptions}
                value={sensorType}
                onChange={(val) => handleSensorTypeChange(val as SensorType)}
                colorTheme="magenta"
              />
            </div>
          </div>

          {/* Row 2: Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Lengkap Sensor *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Discharge Pressure Transmitter Booster Line B"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-[var(--amp-magenta)] focus:ring-1 focus:ring-[var(--amp-magenta)] outline-hidden transition-all"
            />
          </div>

          {/* Row 3: Sensor Binding (Target Type: Area or Pump Asset) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <span className="block font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">
              Target Sensor Binding
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <CustomSelect
                  label="Bind Terhadap"
                  options={targetTypeOptions}
                  value={targetType}
                  onChange={(val) => {
                    const newType = val as 'AREA' | 'PUMP'
                    setTargetType(newType)
                    if (newType === 'AREA') {
                      setTargetId(rooms[0]?.id || 'room-01')
                    } else {
                      setTargetId(allPumps[0]?.id || 'pump-01')
                    }
                  }}
                  colorTheme="magenta"
                />
              </div>

              <div>
                <CustomSelect
                  label="Pilih Objek Terkait"
                  options={targetObjectOptions}
                  value={targetId}
                  onChange={(val) => setTargetId(val)}
                  colorTheme="magenta"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Gateway IoT & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <CustomSelect
                label="Gateway IoT Source"
                options={gatewayOptions}
                value={deviceId}
                onChange={(val) => setDeviceId(val)}
                colorTheme="magenta"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Satuan Ukur (Unit)
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:bg-white focus:border-[var(--amp-magenta)] focus:ring-1 focus:ring-[var(--amp-magenta)] outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Row 5: Alarm Rule Thresholds */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              <span className="block font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">
                Ambang Batas Operasional Normal (Threshold)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[11px] text-slate-500 mb-0.5">
                  Batas Bawah Normal (Min)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-medium text-[11px] text-slate-500 mb-0.5">
                  Batas Atas Alarm (Max)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={maxThreshold}
                  onChange={(e) => setMaxThreshold(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-[var(--amp-magenta)] hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              Simpan Sensor
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
