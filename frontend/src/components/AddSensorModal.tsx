import React, { useState, useEffect } from 'react'
import type { AreaRoom, DeviceGateway, AddSensorInput, SensorType } from '../types/pump'
import { CustomSelect, type SelectOption } from './CustomSelect'
import { Radio, Activity, Layers, Disc, Lock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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

  useEffect(() => {
    if (isOpen) {
      setCode(`PT-0${Math.floor(Math.random() * 90 + 10)}`)
      setName('')
      setSensorType('PRESSURE_SENSOR')
      setMetricCode('pressure_bar')
      setUnit('bar')
      setMinThreshold(0.5)
      setMaxThreshold(6.0)
    }
  }, [isOpen])

  if (!isOpen) return null

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
        setMetricCode('flow_rate_m3h')
        setUnit('m³/h')
        setMinThreshold(5.0)
        setMaxThreshold(85.0)
        break
      case 'LEVEL_SENSOR':
      case 'DISTANCE_SENSOR':
        setMetricCode('water_level_m')
        setUnit('m')
        setMinThreshold(0.2)
        setMaxThreshold(5.0)
        break
      case 'TEMPERATURE_SENSOR':
        setMetricCode('motor_temp_c')
        setUnit('°C')
        setMinThreshold(20.0)
        setMaxThreshold(75.0)
        break
      case 'POWER_METER':
        setMetricCode('power_kw')
        setUnit('kW')
        setMinThreshold(1.0)
        setMaxThreshold(30.0)
        break
      case 'VOLTAGE_SENSOR':
        setMetricCode('voltage_v')
        setUnit('V')
        setMinThreshold(360.0)
        setMaxThreshold(420.0)
        break
      case 'CURRENT_SENSOR':
        setMetricCode('current_a')
        setUnit('A')
        setMinThreshold(2.0)
        setMaxThreshold(45.0)
        break
      default:
        setMetricCode('custom_val')
        setUnit('unit')
        setMinThreshold(0)
        setMaxThreshold(100)
    }
  }

  const sensorTypeOptions: SelectOption[] = [
    { value: 'PRESSURE_SENSOR', label: 'Pressure Sensor (bar)' },
    { value: 'FLOW_METER', label: 'Flow Meter (m³/h)' },
    { value: 'LEVEL_SENSOR', label: 'Water Level Sensor (m)' },
    { value: 'TEMPERATURE_SENSOR', label: 'Temperature Sensor (°C)' },
    { value: 'POWER_METER', label: 'Power Meter (kW)' },
    { value: 'VOLTAGE_SENSOR', label: 'Voltage Sensor (V)' },
    { value: 'CURRENT_SENSOR', label: 'Current Sensor (A)' },
  ]

  const allPumps = rooms.flatMap((r) =>
    r.pumps.map((p) => ({
      ...p,
      areaName: r.name,
    }))
  )

  const targetTypeOptions: SelectOption[] = [
    {
      value: 'AREA',
      label: 'Plant Station / Room',
      icon: <Layers className="size-3.5 text-[#00799e]" />,
    },
    {
      value: 'PUMP',
      label: 'Pump Asset',
      icon: <Disc className="size-3.5 text-[#00799e]" />,
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white border-0 rounded-2xl shadow-xl p-6">
        <DialogHeader className="flex flex-col gap-1 pb-2">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#00799e] text-white flex items-center justify-center shadow-xs shrink-0">
              <Radio className="size-5" />
            </div>
            <div>
              <DialogTitle className="font-heading font-semibold text-base text-slate-900 leading-tight">
                Add Sensor &amp; Telemetry Binding
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-normal mt-0.5">
                Configure field transmitter channel and target telemetry binding
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs pt-1">
          {/* Row 1: Code & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-slate-700">Sensor Tag / Code *</label>
              <Input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. PT-04 / FT-04"
                className="font-mono text-xs font-semibold bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-slate-700">Sensor Instrument Type</label>
              <CustomSelect
                options={sensorTypeOptions}
                value={sensorType}
                onChange={(val) => handleSensorTypeChange(val as SensorType)}
              />
            </div>
          </div>

          {/* Row 2: Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-slate-700">Transmitter / Sensor Name *</label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Discharge Pressure Line B"
              className="text-xs font-medium bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>

          {/* Row 3: Sensor Binding (Target Type: Area or Pump Asset) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2.5">
            <span className="font-semibold text-slate-800 text-xs">
              Sensor Target Binding
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-medium text-slate-700">Binding Scope</label>
                <CustomSelect
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
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-medium text-slate-700">Target Asset / Station</label>
                <CustomSelect
                  options={targetObjectOptions}
                  value={targetId}
                  onChange={(val) => setTargetId(val)}
                />
              </div>
            </div>
          </div>

          {/* Row 4: Gateway IoT & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-slate-700">IoT Gateway Source</label>
              <CustomSelect
                options={gatewayOptions}
                value={deviceId}
                onChange={(val) => setDeviceId(val)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700">Engineering Unit</label>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-normal">
                  <Lock className="size-2.5 text-slate-400" />
                  Auto-calibrated
                </span>
              </div>
              <Input
                type="text"
                readOnly
                disabled
                value={unit}
                className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* Row 5: Alarm Rule Thresholds */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Activity className="size-3.5 text-amber-600" />
              <span className="font-semibold text-slate-800 text-xs">
                Operating Normal Range &amp; Trip Thresholds
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-normal text-[11px] text-slate-500">
                  Lower Normal Limit (Min)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(parseFloat(e.target.value) || 0)}
                  className="font-mono text-xs font-semibold bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-normal text-[11px] text-slate-500">
                  Upper Trip Limit (Max)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={maxThreshold}
                  onChange={(e) => setMaxThreshold(parseFloat(e.target.value) || 0)}
                  className="font-mono text-xs font-semibold bg-white"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <DialogFooter className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-medium text-slate-600 active:scale-[0.975] transition-transform duration-150"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs font-medium text-white bg-[#00799e] hover:bg-[#006887] shadow-xs active:scale-[0.975] transition-transform duration-150"
            >
              Save Sensor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
