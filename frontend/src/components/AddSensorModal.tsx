import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { AreaRoom, DeviceGateway, AddSensorInput, SensorType } from '../types/pump'
import { CustomSelect, type SelectOption } from './CustomSelect'
import { Radio, X, Activity, Layers, Disc, Lock } from 'lucide-react'

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

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setCode(`PT-0${Math.floor(Math.random() * 90 + 10)}`)
      setName('')
      setSensorType('PRESSURE_SENSOR')
      setMetricCode('pressure_bar')
      setUnit('bar')
      setMinThreshold(0.5)
      setMaxThreshold(6.0)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  // Auto configure metric code and unit when sensor type changes (Fixed/ReadOnly)
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
      icon: <Layers className="w-3.5 h-3.5 text-[#00799e]" />,
    },
    {
      value: 'PUMP',
      label: 'Asset Pompa',
      icon: <Disc className="w-3.5 h-3.5 text-[#00799e]" />,
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

    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00799e] text-white flex items-center justify-center shadow-xs">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-base text-slate-900 m-0 leading-tight">
                Tambah Sensor &amp; Binding
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5 font-normal">
                Konfigurasi Instrumentasi &amp; Sensor Binding
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Row 1: Code & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Kode / Tag Sensor *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Contoh: PT-04 / FT-04"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#00799e] outline-hidden transition-all"
              />
            </div>

            <div>
              <CustomSelect
                label="Tipe Instrumentasi Sensor"
                options={sensorTypeOptions}
                value={sensorType}
                onChange={(val) => handleSensorTypeChange(val as SensorType)}
                colorTheme="blue"
              />
            </div>
          </div>

          {/* Row 2: Name */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Nama Lengkap Sensor *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Discharge Pressure Transmitter Booster Line B"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#00799e] outline-hidden transition-all"
            />
          </div>

          {/* Row 3: Sensor Binding (Target Type: Area or Pump Asset) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <span className="block font-semibold text-slate-800 text-xs">
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
                  colorTheme="blue"
                />
              </div>

              <div>
                <CustomSelect
                  label="Pilih Objek Terkait"
                  options={targetObjectOptions}
                  value={targetId}
                  onChange={(val) => setTargetId(val)}
                  colorTheme="blue"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Gateway IoT & Unit (READ ONLY / LOCKED) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <CustomSelect
                label="Gateway IoT Source"
                options={gatewayOptions}
                value={deviceId}
                onChange={(val) => setDeviceId(val)}
                colorTheme="blue"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-medium text-slate-700">
                  Satuan Ukur (Unit)
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-normal">
                  <Lock className="w-2.5 h-2.5 text-slate-400" />
                  Otomatis
                </span>
              </div>
              <input
                type="text"
                readOnly
                disabled
                value={unit}
                title="Satuan ukur terkunci otomatis mengikuti tipe instrumentasi sensor"
                className="w-full px-3 py-2 bg-slate-100/90 border border-slate-200 rounded-xl font-mono text-xs font-semibold text-slate-600 cursor-not-allowed select-none outline-hidden"
              />
            </div>
          </div>

          {/* Row 5: Alarm Rule Thresholds */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              <span className="block font-semibold text-slate-800 text-xs">
                Ambang Batas Operasional Normal (Threshold)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-normal text-[11px] text-slate-500 mb-0.5">
                  Batas Bawah Normal (Min)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs font-semibold text-slate-900 outline-hidden focus:border-[#00799e]"
                />
              </div>
              <div>
                <label className="block font-normal text-[11px] text-slate-500 mb-0.5">
                  Batas Atas Alarm (Max)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={maxThreshold}
                  onChange={(e) => setMaxThreshold(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs font-semibold text-slate-900 outline-hidden focus:border-[#00799e]"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-medium text-white bg-[#00799e] hover:bg-[#006887] active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              Simpan Sensor
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
